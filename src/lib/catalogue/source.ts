/**
 * catalogue/source.ts — SERVER-ONLY catalogue access.
 *
 * Two modes, chosen automatically:
 *   1. Supabase configured (`NEXT_PUBLIC_SUPABASE_URL` + anon key) → reads the
 *      active products from Postgres (RLS only exposes `status = 'active'`).
 *   2. Not configured, empty, or unreachable → returns NO products. The site then
 *      shows the honest "new designs arriving" state instead of invented
 *      inventory. A visitor must never see a piece the showroom does not have.
 *
 * Reads are wrapped in `use cache` because the catalogue is identical for every
 * visitor; the tag lets the admin panel invalidate it after a product change.
 * Never import this module from a client component.
 */

import { cacheLife, cacheTag } from "next/cache";
import { publicSupabase } from "@/lib/supabase/public";
import type { Availability, Gender, Metal, Occasion, PriceType, Product, Purity } from "./types";
import type { JewelTypeSlug } from "./types";

export type CatalogueResult = {
  products: Product[];
  /** "database" → live Postgres rows, "empty" → nothing published yet. */
  source: "database" | "empty";
};

type ProductImageRow = {
  url: string;
  alt_en: string | null;
  alt_hi: string | null;
  position: number | null;
  is_primary: boolean | null;
};

type ProductRow = {
  code: string;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en: string | null;
  description_hi: string | null;
  metal: Metal | null;
  purity: Purity | null;
  gemstone: string | null;
  weight_grams: number | string | null;
  price_inr: number | string | null;
  is_price_on_request: boolean | null;
  availability: Availability | null;
  is_featured: boolean | null;
  created_at: string | null;
  categories: { slug: string } | { slug: string }[] | null;
  product_images: ProductImageRow[] | null;
};

/** Columns added by the Stage 2.1 migration; read opportunistically. */
type ProductRowWithFilters = ProductRow & {
  gender?: Gender | null;
  occasion?: Occasion | null;
  stone_detail?: string | null;
  jewelry_type?: JewelTypeSlug | null;
};

/**
 * Columns the baseline schema (supabase/schema.sql) certainly has.
 */
const BASE_COLUMNS =
  "code, slug, name_en, name_hi, description_en, description_hi, metal, purity, gemstone, " +
  "weight_grams, price_inr, is_price_on_request, availability, is_featured, created_at, " +
  "categories ( slug ), product_images ( url, alt_en, alt_hi, position, is_primary )";

/**
 * Baseline columns plus the Stage 2.1 filter columns. They are requested first so
 * the type/gender/occasion filters work as soon as the migration has been run;
 * a deployment that has not run it yet falls back to `BASE_COLUMNS` instead of
 * failing, and the filters then simply match nothing instead of lying.
 */
const EXTENDED_COLUMNS = `${BASE_COLUMNS}, jewelry_type, gender, occasion, stone_detail`;

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceTypeFromRow(row: ProductRowWithFilters): PriceType {
  if (row.availability === "sold_out") return "unavailable";
  if (row.is_price_on_request === false && toNumber(row.price_inr) !== null) return "fixed";
  if (row.availability === "on_enquiry") return "on_enquiry";
  return "on_enquiry";
}

function mapRow(row: ProductRowWithFilters): Product {
  const category = first(row.categories);
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.position ?? 0) - (b.position ?? 0);
    })
    .map((image) => image.url);

  return {
    code: row.code,
    slug: row.slug,
    name: { en: row.name_en, hi: row.name_hi },
    description: { en: row.description_en ?? "", hi: row.description_hi ?? "" },
    categorySlug: category?.slug ?? "",
    type: (row.jewelry_type ?? "necklaces") as JewelTypeSlug,
    metal: (row.metal ?? "gold") as Metal,
    purity: row.purity ?? null,
    gender: (row.gender ?? "unisex") as Gender,
    occasion: (row.occasion ?? "daily") as Occasion,
    weightGrams: toNumber(row.weight_grams),
    gemstone: row.gemstone,
    stoneDetail: row.stone_detail ?? null,
    priceType: priceTypeFromRow(row),
    priceINR: row.is_price_on_request === false ? toNumber(row.price_inr) : null,
    availability: (row.availability ?? "on_enquiry") as Availability,
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at ?? "1970-01-01T00:00:00.000Z",
    imageKeys: images,
    specs: [],
    // Rows that came from Postgres are real inventory, not fixtures.
  };
}

/**
 * The whole public catalogue. Cached for an hour; `revalidateTag("catalogue")`
 * after an admin edit (the admin panel and the seed script both do this).
 */
export async function getCatalogue(): Promise<CatalogueResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const supabase = publicSupabase();
  if (!supabase) return { products: [], source: "empty" };

  try {
    const query = (columns: string) =>
      supabase
        .from("products")
        .select(columns)
        .eq("status", "active")
        .order("sort_order", { ascending: true });

    let { data, error } = await query(EXTENDED_COLUMNS);
    if (error) {
      // Almost certainly `column products.jewelry_type does not exist` — the
      // Stage 2.1 migration has not been applied to this database yet.
      ({ data, error } = await query(BASE_COLUMNS));
    }

    if (error) throw error;
    const rows = (data ?? []) as unknown as ProductRowWithFilters[];
    // An empty table is an empty shop, not an invitation to invent one.
    return { products: rows.map(mapRow), source: rows.length > 0 ? "database" : "empty" };
  } catch {
    // A broken connection must never take the storefront down — and must never
    // swap in fixtures either. The pages show their empty state.
    return { products: [], source: "empty" };
  }
}

/** One product by slug, or null. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalogue();
  return products.find((product) => product.slug === slug) ?? null;
}

/** Products by wishlist code, preserving the caller's order. */
export async function getProductsByCodes(codes: string[]): Promise<Product[]> {
  const { products } = await getCatalogue();
  const byCode = new Map(products.map((product) => [product.code, product]));
  return codes.map((code) => byCode.get(code)).filter((product): product is Product => Boolean(product));
}

/** Every slug, for generateStaticParams / sitemap. */
export async function getAllProductSlugs(): Promise<string[]> {
  const { products } = await getCatalogue();
  return products.map((product) => product.slug);
}
