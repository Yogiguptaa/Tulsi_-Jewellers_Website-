/**
 * lib/seo.ts — metadata + structured-data helpers.
 *
 * RULE: structured data is machine-readable, so an invented value here is worse
 * than a missing one. Every builder below emits only facts the showroom has
 * confirmed (name, area, city, phone numbers, the collections it sells). Fields
 * that depend on owner input — street address, opening hours, geo coordinates,
 * aggregate rating — are omitted until real values exist, because a wrong
 * aggregateRating or openingHoursSpecification is a search-quality penalty and a
 * factual claim we cannot support.
 */

import type { Metadata } from "next";
import { COLLECTIONS, CONTACT, DELIVERY, RATE_DISCLAIMER, SITE, pick, type Lang } from "@/lib/config";

export function absoluteUrl(path: string): string {
  const base = SITE.baseUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type MetaInput = {
  title: string;
  description: string;
  path: string;
  /** Absolute or root-relative image path for the social preview. */
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  image,
  keywords,
  noIndex = false,
}: MetaInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Tulsi Jewellers",
      locale: "en_IN",
      images: image ? [{ url: absoluteUrl(image), alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/* -------------------------------------------------------------------------- */
/* JSON-LD                                                                     */
/* -------------------------------------------------------------------------- */

type JsonLdNode = Record<string, unknown>;

/**
 * The showroom as a JewelryStore. `address` carries only the locality the owner
 * confirmed; `streetAddress` is added once the full address is supplied.
 */
export function jewelryStoreJsonLd(lang: Lang = "en"): JsonLdNode {
  const node: JsonLdNode = {
    "@type": "JewelryStore",
    "@id": absoluteUrl("/#store"),
    name: pick(SITE.name, lang),
    url: absoluteUrl("/"),
    description: SITE.defaultMetaDescription,
    areaServed: { "@type": "City", name: "Nagpur" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nagpur",
      addressRegion: "MH",
      addressCountry: "IN",
    },
    telephone: CONTACT.phones.map((entry) => entry.number),
  };
  // Only include the street address when it is real (never a [PLACEHOLDER]).
  const street = pick(CONTACT.address, lang);
  if (!street.startsWith("[")) {
    (node.address as Record<string, unknown>).streetAddress = street;
  }
  return node;
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]): JsonLdNode {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * Product structured data. Deliberately does NOT emit `offers`/`price` unless the
 * owner supplied a firm price — "Price on Enquiry" is not a price, and marking an
 * enquiry-only item as purchasable would be a false availability claim.
 * `aggregateRating` is never emitted: there are no verified reviews yet.
 */
export function productJsonLd(product: {
  name: string;
  description: string;
  slug: string;
  code: string;
  image?: string;
  priceINR: number | null;
  brandName: string;
}): JsonLdNode {
  const node: JsonLdNode = {
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    sku: product.code,
    url: absoluteUrl(`/products/${product.slug}`),
    image: product.image ? absoluteUrl(product.image) : undefined,
    brand: { "@type": "Brand", name: product.brandName },
  };
  if (product.priceINR !== null) {
    node.offers = {
      "@type": "Offer",
      price: product.priceINR,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/products/${product.slug}`),
    };
  }
  return node;
}

export function collectionsJsonLd(lang: Lang = "en"): JsonLdNode {
  return {
    "@type": "ItemList",
    name: `${pick(SITE.name, lang)} collections`,
    itemListElement: COLLECTIONS.map((collection, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: pick(collection.name, lang),
      url: absoluteUrl(`/collections/${collection.slug}`),
    })),
  };
}

export function guideJsonLd(guide: {
  title: string;
  summary: string;
  slug: string;
}): JsonLdNode {
  return {
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    url: absoluteUrl(`/guides/${guide.slug}`),
    publisher: { "@type": "Organization", name: SITE.name.en },
    // No datePublished/dateModified: the file system is not an authored date and
    // inventing one would be a false claim.
  };
}

/** Wraps nodes into a single @graph document for one <script type="application/ld+json">. */
export function jsonLdGraph(nodes: JsonLdNode[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}

export const SEO_RATE_NOTE = RATE_DISCLAIMER;
export const SEO_DELIVERY_NOTE = DELIVERY.outsideNagpurNote;
