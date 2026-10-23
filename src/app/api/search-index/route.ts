/**
 * GET /api/search-index — the compact list the command palette searches.
 *
 * It carries only labels, hrefs and search keywords: no prices, no stock and no
 * rate, so nothing on the palette can become stale or be mistaken for a value.
 * Pages, collections, jewellery types, guides and the catalogue all come from the
 * same source the site itself renders from.
 */

import { NextResponse } from "next/server";
import { COLLECTIONS, GEMSTONES, ROUTES, SCHEME, SITE, pick } from "@/lib/config";
import { JEWEL_TYPES } from "@/lib/catalogue/jewel-types";
import { GUIDES } from "@/lib/content/guides";
import { getCatalogue } from "@/lib/catalogue/source";

export type SearchEntry = {
  kind: "page" | "collection" | "type" | "guide" | "product";
  label: string;
  labelHi: string;
  href: string;
  /** Extra words that should match, lower-cased. */
  keywords: string[];
};

export async function GET() {
  const { products } = await getCatalogue();

  const pages: SearchEntry[] = [
    { href: ROUTES.rates, label: "Gold & silver rates", labelHi: "सोना और चांदी भाव" },
    { href: "/rates/calculator", label: "Metal value calculator", labelHi: "धातु मूल्य कैलकुलेटर" },
    { href: "/rates/history", label: "Rate history", labelHi: "भाव इतिहास" },
    { href: ROUTES.collections, label: "All collections", labelHi: "सभी संग्रह" },
    { href: ROUTES.gems, label: "Gems / ratna", labelHi: "रत्न" },
    { href: ROUTES.scheme, label: "Gold saving scheme", labelHi: "गोल्ड सेविंग स्कीम" },
    { href: ROUTES.visit, label: "Visit us / directions", labelHi: "हमसे मिलें" },
    { href: ROUTES.contact, label: "Contact & enquiry", labelHi: "संपर्क" },
    { href: ROUTES.about, label: "About the showroom", labelHi: "हमारे बारे में" },
    { href: ROUTES.faq, label: "FAQ", labelHi: "अक्सर पूछे जाने वाले प्रश्न" },
    { href: ROUTES.wishlist, label: "My wishlist", labelHi: "मेरी पसंद" },
    { href: "/gold-saving-scheme", label: "Scheme instalments", labelHi: "स्कीम किश्तें" },
  ].map((entry) => ({
    kind: "page" as const,
    ...entry,
    keywords: [entry.label.toLowerCase(), entry.labelHi, SITE.name.en.toLowerCase()],
  }));

  const collections: SearchEntry[] = COLLECTIONS.map((collection) => ({
    kind: "collection",
    label: pick(collection.name, "en"),
    labelHi: pick(collection.name, "hi"),
    href: `/collections/${collection.slug}`,
    keywords: [collection.slug, pick(collection.name, "en").toLowerCase(), pick(collection.name, "hi")],
  }));

  const types: SearchEntry[] = JEWEL_TYPES.map((type) => ({
    kind: "type",
    label: pick(type.name, "en"),
    labelHi: pick(type.name, "hi"),
    href: `/jewellery/${type.slug}`,
    keywords: [type.slug, pick(type.name, "en").toLowerCase(), pick(type.chip, "en").toLowerCase()],
  }));

  const guides: SearchEntry[] = GUIDES.map((guide) => ({
    kind: "guide",
    label: pick(guide.title, "en"),
    labelHi: pick(guide.title, "hi"),
    href: `/guides/${guide.slug}`,
    keywords: [guide.slug, pick(guide.title, "en").toLowerCase()],
  }));

  const stones: SearchEntry[] = GEMSTONES.map((stone) => ({
    kind: "collection",
    label: pick(stone.name, "en"),
    labelHi: pick(stone.name, "hi"),
    href: `/collections/gems?q=${encodeURIComponent(pick(stone.name, "en"))}`,
    keywords: [stone.slug, pick(stone.name, "en").toLowerCase(), pick(stone.name, "hi")],
  }));

  const catalogue: SearchEntry[] = products.map((product) => ({
    kind: "product",
    label: pick(product.name, "en"),
    labelHi: pick(product.name, "hi"),
    href: `/products/${product.slug}`,
    keywords: [
      product.code.toLowerCase(),
      pick(product.name, "en").toLowerCase(),
      pick(product.name, "hi"),
      product.purity ?? "",
      product.categorySlug,
    ].filter(Boolean),
  }));

  return NextResponse.json(
    {
      schemeName: pick(SCHEME.name, "en"),
      entries: [...pages, ...collections, ...types, ...stones, ...guides, ...catalogue],
    },
    // Public, non-personal and cheap to re-fetch; a short cache keeps typing snappy.
    { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } },
  );
}
