/**
 * catalogue/select.ts — pure search / filter / sort over Product[].
 *
 * Kept dependency-free and synchronous so the same helpers run on the server
 * (collection pages) and in the client catalogue browser.
 *
 * Filters combine with AND, including the provenance filter: choosing "Showroom
 * pieces" must never leave an inspiration tile in the results.
 */

import { COLLECTIONS, GEMSTONES, pick, type Lang } from "@/lib/config";
import { JEWEL_TYPE_BY_SLUG } from "./jewel-types";
import { styleLabel } from "./catalogue-kind";
import type { CatalogueFilters, Product, SortKey } from "./types";

export function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Everything searchable for one product, in both languages. */
export function searchText(product: Product): string {
  const collection = COLLECTIONS.find((entry) => entry.slug === product.categorySlug);
  const gemstone = GEMSTONES.find((entry) => entry.slug === product.gemstone);
  const type = JEWEL_TYPE_BY_SLUG[product.type];
  return normalise(
    [
      product.name.en,
      product.name.hi,
      product.description.en,
      product.description.hi,
      product.code,
      product.type,
      product.metal,
      product.purity ?? "",
      product.gemstone ?? "",
      product.style ?? "",
      product.supplier?.name ?? "",
      product.catalogueType,
      gemstone?.name.en ?? "",
      gemstone?.name.hi ?? "",
      collection?.name.en ?? "",
      collection?.name.hi ?? "",
      type?.name.en ?? "",
      type?.name.hi ?? "",
      // "24k gold", "silver 925" and the style label people actually type.
      product.purity ? `${product.purity} ${product.metal}` : "",
      product.style ? styleLabel(product.style, "en") : "",
    ].join(" "),
  );
}

/** Multi-word query: every token must appear somewhere in the product text. */
export function matchesQuery(product: Product, query: string): boolean {
  const tokens = normalise(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = searchText(product);
  return tokens.every((token) => haystack.includes(token));
}

/** Does the product belong on a /jewellery/<slug> page? */
export function matchesJewelTypeSlug(product: Product, slug: string): boolean {
  const page = JEWEL_TYPE_BY_SLUG[slug];
  if (!page) return false;
  if (page.kind === "type") {
    if (slug === "gemstones") return product.metal === "gemstone";
    if (slug === "bangles") return product.type === "bangles";
    return product.type === slug;
  }
  if (page.kind === "gender") {
    if (slug === "womens-jewellery") return product.gender === "women" || product.gender === "unisex";
    if (slug === "mens-jewellery") return product.gender === "men" || product.gender === "unisex";
    return product.gender === "kids";
  }
  // Occasion group: bridal, plus everything in the bridal collection.
  return product.occasion === "bridal" || product.categorySlug === "bridal";
}

export function filterProducts(list: Product[], filters: CatalogueFilters): Product[] {
  return list.filter((product) => {
    if (filters.query && !matchesQuery(product, filters.query)) return false;
    if (filters.categorySlug && product.categorySlug !== filters.categorySlug) return false;
    if (filters.type) {
      if (!matchesJewelTypeSlug(product, filters.type)) return false;
    }
    if (filters.catalogueType && product.catalogueType !== filters.catalogueType) return false;
    if (filters.style && product.style !== filters.style) return false;
    if (filters.metal && product.metal !== filters.metal) return false;
    if (filters.purity && product.purity !== filters.purity) return false;
    if (filters.gender && product.gender !== filters.gender) return false;
    if (filters.occasion && product.occasion !== filters.occasion) return false;
    if (filters.availability && product.availability !== filters.availability) return false;
    if (filters.gemstone && product.gemstone !== filters.gemstone) return false;
    if (typeof filters.maxPriceINR === "number") {
      // Only products with a real price can satisfy a price bound; everything
      // else is "Price on Enquiry" and is filtered out.
      if (product.priceINR === null || product.priceINR > filters.maxPriceINR) return false;
    }
    return true;
  });
}

export function sortProducts(list: Product[], sort: SortKey = "featured", lang: Lang = "en"): Product[] {
  const copy = [...list];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price_asc":
      // On-enquiry products (no price) always sort last, never as ₹0 and never
      // as the cheapest thing in the grid.
      return copy.sort((a, b) => comparePrice(a, b, 1));
    case "price_desc":
      return copy.sort((a, b) => comparePrice(a, b, -1));
    case "name_asc":
      return copy.sort((a, b) => pick(a.name, lang).localeCompare(pick(b.name, lang)));
    case "featured":
    default:
      return copy.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.name.en.localeCompare(b.name.en);
      });
  }
}

/**
 * Price order that leaves unpriced products at the end in BOTH directions.
 * A plain numeric sort cannot do that: `Infinity` is last ascending but first
 * descending, which would have put every "Price on Enquiry" piece at the top of
 * a "high to low" list.
 */
function comparePrice(a: Product, b: Product, direction: 1 | -1): number {
  const aPriced = a.priceINR !== null;
  const bPriced = b.priceINR !== null;
  if (aPriced !== bPriced) return aPriced ? -1 : 1;
  if (!aPriced || !bPriced) return a.name.en.localeCompare(b.name.en);
  return (a.priceINR! - b.priceINR!) * direction;
}

export function getFeatured(list: Product[], limit = 8): Product[] {
  return list.filter((product) => product.isFeatured).slice(0, limit);
}

/**
 * Related designs. Same provenance scores highest: a showroom piece should not
 * have a supplier design presented beside it as if it were also on the shelf.
 */
export function getRelated(list: Product[], product: Product, limit = 4): Product[] {
  const scored = list
    .filter((candidate) => candidate.code !== product.code)
    .map((candidate) => {
      let score = 0;
      if (candidate.catalogueType === product.catalogueType) score += 3;
      if (candidate.categorySlug === product.categorySlug) score += 3;
      if (candidate.type === product.type) score += 2;
      if (candidate.style && candidate.style === product.style) score += 2;
      if (candidate.metal === product.metal) score += 1;
      if (candidate.purity && candidate.purity === product.purity) score += 1;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.candidate);
}

export function getByIds(list: Product[], codes: string[]): Product[] {
  if (codes.length === 0) return [];
  const byCode = new Map(list.map((product) => [product.code, product]));
  return codes.map((code) => byCode.get(code)).filter((product): product is Product => Boolean(product));
}

/** Distinct values present in the data — filters are only offered for these. */
export function availableFacets(list: Product[]) {
  const uniq = <T extends string>(values: T[]) => Array.from(new Set(values)).sort();
  return {
    metals: uniq(list.map((product) => product.metal)),
    purities: uniq(list.map((product) => product.purity).filter((v): v is NonNullable<typeof v> => Boolean(v))),
    genders: uniq(list.map((product) => product.gender)),
    occasions: uniq(list.map((product) => product.occasion)),
    gemstones: uniq(list.map((product) => product.gemstone).filter((v): v is string => Boolean(v))),
    styles: uniq(list.map((product) => product.style).filter((v): v is string => Boolean(v))),
    catalogueTypes: uniq(list.map((product) => product.catalogueType)),
    availabilities: uniq(list.map((product) => product.availability)),
    hasPrices: list.some((product) => product.priceINR !== null),
    categories: uniq(list.map((product) => product.categorySlug)),
  };
}
