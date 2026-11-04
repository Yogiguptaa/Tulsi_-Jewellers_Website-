/**
 * catalogue/types.ts — domain types for the product catalogue.
 *
 * These mirror the Supabase tables in supabase/schema.sql so the same UI works
 * whether the data comes from the static JSON catalogue, from Postgres, or from
 * both merged. Field names stay camelCase in the UI; the mappers in
 * ./source.ts and ./static.ts translate to and from the stored shape.
 *
 * PROVENANCE IS PART OF THE MODEL
 * ──────────────────────────────
 * `catalogueType` is not decoration. It is what stops the site from telling a
 * customer that an inspiration photograph or an authorised supplier design is a
 * piece sitting in the Hansapuri showroom:
 *
 *   showroom    — a piece the showroom has; `availability` is meaningful.
 *   inspiration — a design style shown for reference only; never stock, never a
 *                 price, never a delivery promise.
 *   supplier    — an authorised supplier's design that can be ordered on
 *                 request; the supplier is named, availability is not claimed.
 *
 * The importer refuses a row that breaks that rule (in_stock or a fixed price on
 * a non-showroom entry), so it cannot be introduced by data entry alone.
 */

import type { LocalizedText } from "@/lib/config";

export type Metal = "gold" | "silver" | "fashion" | "gemstone";
export type Purity = "24K" | "22K" | "20K" | "18K" | "14K" | "925" | "other";
/** Kept in the same order/wording as the `availability_state` Postgres enum. */
export type Availability = "on_enquiry" | "in_stock" | "sold_out";
export type Gender = "women" | "men" | "kids" | "unisex";
export type Occasion = "bridal" | "daily" | "festive" | "gifting";
export type PriceType = "on_enquiry" | "fixed" | "rate_based" | "unavailable";
/** Where the piece comes from. See the header comment. */
export type CatalogueType = "showroom" | "inspiration" | "supplier";

/** Jewellery type pages (/jewellery/<slug>) and catalogue chips. */
export type JewelTypeSlug =
  | "rings"
  | "necklaces"
  | "earrings"
  | "bangles"
  | "bracelets"
  | "chains"
  | "pendants"
  | "mangalsutra"
  | "necklace-sets"
  | "anklets"
  | "coins-bars"
  | "idols"
  | "gemstones";

export type ProductSpec = {
  label: LocalizedText;
  /** Free text, usually a number + unit or a short fact. */
  value: string;
};

/** Authorised supplier provenance, as supplied by the showroom. */
export type SupplierSource = {
  /** Trading name printed on the product page. Never inferred. */
  name: string;
  /** The supplier's own reference for the design, if they publish one. */
  ref: string | null;
  /** Optional https link to the supplier's own page. Validated before render. */
  url: string | null;
};

export type Product = {
  /** Stable code — also the wishlist key and the WhatsApp reference. */
  code: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  /** Collection slug from config.ts COLLECTIONS. */
  categorySlug: string;
  /** Item type, used by /jewellery/<slug>. */
  type: JewelTypeSlug;
  /** Free-form style slug (temple, kundan, minimal, daily-wear …). */
  style: string | null;
  metal: Metal;
  purity: Purity | null;
  gender: Gender;
  occasion: Occasion;
  /** Weight in grams. `null` when not supplied (never guessed). */
  weightGrams: number | null;
  /** Gemstone slug from config.ts GEMSTONES (gems collection only). */
  gemstone: string | null;
  /** Only ever a factual, owner-supplied description. */
  stoneDetail: string | null;
  priceType: PriceType;
  /** Only set for priceType === "fixed", with a real owner-supplied price. */
  priceINR: number | null;
  availability: Availability;
  isFeatured: boolean;
  /** ISO timestamp — drives the "Newest" sort. */
  createdAt: string;
  /** Public paths or https URLs (Cloudinary). Resolved by catalogue/images.ts. */
  imageKeys: string[];
  specs: ProductSpec[];
  /** showroom | inspiration | supplier — see the header comment. */
  catalogueType: CatalogueType;
  /** Present only for catalogueType === "supplier". */
  supplier: SupplierSource | null;
  /** ISO date (YYYY-MM-DD) of the last catalogue edit. */
  lastUpdated: string;
};

export type CatalogueFilters = {
  query?: string;
  categorySlug?: string;
  type?: JewelTypeSlug;
  catalogueType?: CatalogueType;
  style?: string;
  metal?: Metal;
  purity?: Purity;
  gender?: Gender;
  occasion?: Occasion;
  availability?: Availability;
  gemstone?: string;
  /** Inclusive metal-price bound in INR (only priced products can match). */
  maxPriceINR?: number;
};

export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "name_asc";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: LocalizedText }> = [
  { value: "featured", label: { en: "Featured", hi: "विशेष" } },
  { value: "newest", label: { en: "Newest", hi: "नवीनतम" } },
  { value: "price_asc", label: { en: "Price: low to high", hi: "कीमत: कम से ज़्यादा" } },
  { value: "price_desc", label: { en: "Price: high to low", hi: "कीमत: ज़्यादा से कम" } },
  { value: "name_asc", label: { en: "Name (A–Z)", hi: "नाम (अ–ज्ञ)" } },
];
