/**
 * catalogue/source.ts — SERVER-ONLY catalogue access.
 *
 * Three sources, merged in this order:
 *
 *   1. The static JSON catalogue (src/content/catalogue/products.json), read from
 *      disk with no network at all. This is the catalogue that always works, and
 *      it is what "the site still loads when an external service is down" means
 *      in practice.
 *   2. Supabase, when it is configured: the admin panel's active products. A row
 *      from the database wins over a static row with the same code, so an edit in
 *      the panel is what customers see.
 *   3. Nothing. The pages then show the honest "new designs arriving" state
 *      instead of invented inventory.
 *
 * Reads are wrapped in `use cache` because the catalogue is identical for every
 * visitor; the tag lets the admin panel invalidate it after a product change.
 * A failure in step 2 is logged as a count only and never takes the catalogue
 * down — step 1 has already produced a result by then.
 *
 * Never import this module from a client component.
 */

import { cacheLife, cacheTag } from "next/cache";
import { publicSupabase } from "@/lib/supabase/public";
import type {
  Availability,
  CatalogueType,
  Gender,
  JewelTypeSlug,
  Metal,
  Occasion,
  PriceType,
  Product,
  Purity,
  SupplierSource,
} from "./types";
import { loadStaticCatalogue } from "./static";

export type CatalogueResult = {
  products: Product[];
  /** Where the visible rows came from. */
  source: "static" | "database" | "mixed" | "empty";
  /** Rows rejected by validation, for the health check. No content, just counts. */
  rejected: number;
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
  catalogue_type?: CatalogueType | null;
  style?: string | null;
  supplier_name?: string | null;
  supplier_ref?: string | null;
  updated_at?: string | null;
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
const EXTENDED_COLUMNS =
  `${BASE_COLUMNS}, jewelry_type, gender, occasion, stone_detail, style, ` +
  "catalogue_type, supplier_name, supplier_ref, updated_at";

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

  const catalogueType: CatalogueType = row.catalogue_type ?? "showroom";
  const supplier: SupplierSource | null =
    catalogueType === "supplier" && row.supplier_name
      ? { name: row.supplier_name, ref: row.supplier_ref ?? null, url: null }
      : null;

  return {
    code: row.code,
    slug: row.slug,
    name: { en: row.name_en, hi: row.name_hi },
    description: { en: row.description_en ?? "", hi: row.description_hi ?? "" },
    categorySlug: category?.slug ?? "",
    type: (row.jewelry_type ?? "necklaces") as JewelTypeSlug,
    style: row.style ?? null,
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
    catalogueType,
    supplier,
    lastUpdated: (row.updated_at ?? row.created_at ?? "").slice(0, 10) || "unknown",
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

  const staticCatalogue = loadStaticCatalogue();
  const merged = new Map<string, Product>(
    staticCatalogue.products.map((product) => [product.code.toLowerCase(), product]),
  );

  const supabase = publicSupabase();
  if (!supabase) {
    return {
      products: [...merged.values()],
      source: merged.size > 0 ? "static" : "empty",
      rejected: staticCatalogue.rejected.length,
    };
  }

  try {
    const query = (columns: string) =>
      supabase.from("products").select(columns).eq("status", "active").order("sort_order", {
        ascending: true,
      });

    let { data, error } = await query(EXTENDED_COLUMNS);
    if (error) {
      // Almost certainly `column products.catalogue_type does not exist` — the
      // provenance migration has not been applied to this database yet.
      ({ data, error } = await query(BASE_COLUMNS));
    }
    if (error) throw error;

    const rows = (data ?? []) as unknown as ProductRowWithFilters[];
    const fromDb = rows.map(mapRow);
    let overrides = 0;
    for (const product of fromDb) {
      const key = product.code.toLowerCase();
      if (merged.has(key)) overrides += 1;
      merged.set(key, product);
    }

    const products = [...merged.values()];
    const source: CatalogueResult["source"] =
      products.length === 0
        ? "empty"
        : fromDb.length === 0
          ? "static"
          : overrides > 0
            ? "mixed"
            : "database";

    return { products, source, rejected: staticCatalogue.rejected.length };
  } catch {
    // A broken connection must never take the storefront down, and must never
    // swap in invented rows either. The static catalogue stands.
    return {
      products: [...merged.values()],
      source: merged.size > 0 ? "static" : "empty",
      rejected: staticCatalogue.rejected.length,
    };
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
