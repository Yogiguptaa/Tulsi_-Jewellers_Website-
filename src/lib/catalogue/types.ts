/**
 * catalogue/types.ts — domain types for the product catalogue.
 *
 * These mirror the Supabase tables in supabase/schema.sql so the same UI works
 * whether the data comes from the local fixtures or from Postgres. Field names stay camelCase in the UI; the mappers in
 * ./source.ts translate to/from the snake_case columns.
 */

import type { LocalizedText } from "@/lib/config";

export type Metal = "gold" | "silver" | "fashion" | "gemstone";
export type Purity = "24K" | "22K" | "20K" | "18K" | "14K" | "925" | "other";
/** Kept in the same order/wording as the `availability_state` Postgres enum. */
export type Availability = "on_enquiry" | "in_stock" | "sold_out";
export type Gender = "women" | "men" | "kids" | "unisex";
export type Occasion = "bridal" | "daily" | "festive" | "gifting";
export type PriceType = "on_enquiry" | "fixed" | "rate_based" | "unavailable";

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

export type Product = {
  /** Stable code — also the wishlist key. */
  code: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  /** Collection slug from config.ts COLLECTIONS. */
  categorySlug: string;
  /** Item type, used by /jewellery/<slug>. */
  type: JewelTypeSlug;
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
  /** Manifest keys or direct Storage URLs. */
  imageKeys: string[];
  specs: ProductSpec[];
};

export type CatalogueFilters = {
  query?: string;
  categorySlug?: string;
  type?: JewelTypeSlug;
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

