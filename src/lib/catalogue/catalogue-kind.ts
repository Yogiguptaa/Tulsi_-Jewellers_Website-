/**
 * catalogue/catalogue-kind.ts — provenance copy, in one place.
 *
 * Client-safe (no server imports), so the same wording appears on a product card,
 * in the quick view, on the detail page and in a WhatsApp message. The rules:
 *
 *   • A showroom piece may say "In the showroom" only when someone recorded it as
 *     in stock. Otherwise it says "Ask availability" — never "available".
 *   • An inspiration design never claims stock, a price or delivery.
 *   • A supplier design names the supplier and says it is ordered on request.
 *
 * Keeping this here rather than inline in components is what makes the rule
 * testable (`tests/catalogue.test.ts`).
 */

import { pick, type Lang, type LocalizedText } from "@/lib/config";
import type { CatalogueType, Product } from "./types";

export const CATALOGUE_TYPE_LABELS: Record<CatalogueType, LocalizedText> = {
  showroom: { en: "Showroom piece", hi: "शोरूम का गहना" },
  inspiration: { en: "Design inspiration", hi: "डिज़ाइन प्रेरणा" },
  supplier: { en: "Supplier design", hi: "सप्लायर डिज़ाइन" },
};

/** Short badge text used on the card and the detail page. */
export const CATALOGUE_TYPE_BADGES: Record<CatalogueType, LocalizedText> = {
  showroom: { en: "In showroom", hi: "शोरूम में" },
  inspiration: { en: "Inspiration", hi: "प्रेरणा" },
  supplier: { en: "Supplier design", hi: "सप्लायर डिज़ाइन" },
};

/** What the piece's availability line is allowed to say. */
export function availabilityLabel(product: Product, lang: Lang): string {
  if (product.catalogueType === "inspiration") {
    return pick(
      { en: "Design inspiration — not showroom stock", hi: "डिज़ाइन प्रेरणा — शोरूम स्टॉक नहीं" },
      lang,
    );
  }
  if (product.catalogueType === "supplier") {
    return pick(
      {
        en: "Supplier design — ordered on request",
        hi: "सप्लायर डिज़ाइन — अनुरोध पर मंगाया जाता है",
      },
      lang,
    );
  }
  if (product.availability === "in_stock") {
    return pick({ en: "In the showroom", hi: "शोरूम में उपलब्ध" }, lang);
  }
  if (product.availability === "sold_out") {
    return pick({ en: "Not available right now", hi: "अभी उपलब्ध नहीं" }, lang);
  }
  return pick({ en: "Ask availability", hi: "उपलब्धता पूछें" }, lang);
}

export type AvailabilityTone = "stock" | "query" | "out" | "design";

/** Drives the colour of the badge, so "sold out" never looks like "in stock". */
export function availabilityTone(product: Product): AvailabilityTone {
  if (product.catalogueType !== "showroom") return "design";
  if (product.availability === "in_stock") return "stock";
  if (product.availability === "sold_out") return "out";
  return "query";
}

/**
 * The honesty notice shown on the product page, or null for a showroom piece
 * (which needs no disclaimer — it is really there).
 */
export function provenanceNotice(
  product: Product,
  lang: Lang,
): { title: string; body: string } | null {
  if (product.catalogueType === "inspiration") {
    return {
      title: pick({ en: "Design inspiration", hi: "डिज़ाइन प्रेरणा" }, lang),
      body: pick(
        {
          en: "This is a design reference, not a piece held in the showroom. It is shown so you can describe the style you want. Ask us and we will tell you what we can make or arrange, its weight and its price.",
          hi: "यह एक डिज़ाइन संदर्भ है, शोरूम में रखा हुआ गहना नहीं। इसे इसलिए दिखाया गया है ताकि आप अपनी पसंद की शैली बता सकें। पूछने पर हम बताएँगे कि हम क्या बना या मंगा सकते हैं, उसका वज़न और कीमत क्या होगी।",
        },
        lang,
      ),
    };
  }
  if (product.catalogueType === "supplier") {
    const supplier = product.supplier?.name ?? "";
    return {
      title: pick({ en: "Supplier design", hi: "सप्लायर डिज़ाइन" }, lang),
      body: pick(
        {
          en: `This design comes from ${supplier}, an authorised supplier, and is not held in the showroom. It can be ordered on request; the showroom will confirm the price, the making time and the exact specification before anything is agreed.`,
          hi: `यह डिज़ाइन ${supplier} का है, जो हमारा अधिकृत सप्लायर है, और शोरूम में रखा हुआ नहीं है। इसे अनुरोध पर मंगाया जा सकता है; कोई भी बात तय होने से पहले शोरूम कीमत, बनने का समय और सही विवरण बताएगा।`,
        },
        lang,
      ),
    };
  }
  return null;
}

/** "Source: <supplier>" line for a supplier design, else null. */
export function supplierLine(product: Product, lang: Lang): string | null {
  if (product.catalogueType !== "supplier" || !product.supplier) return null;
  const ref = product.supplier.ref ? ` · ${product.supplier.ref}` : "";
  return `${pick({ en: "Supplier", hi: "सप्लायर" }, lang)}: ${product.supplier.name}${ref}`;
}

/**
 * The WhatsApp enquiry body. Always names the piece and its code so the showroom
 * can identify it from the message alone, and states the provenance so nobody
 * promises a supplier design as if it were on the shelf.
 */
export function enquiryMessage(product: Product): string {
  const label =
    product.catalogueType === "supplier"
      ? " (supplier design, item"
      : product.catalogueType === "inspiration"
        ? " (design reference, item"
        : " (item";
  return (
    `Hello Tulsi Jewellers, I am interested in ${product.name.en}${label} ${product.code}). ` +
    "Please share the availability, weight and price."
  );
}

/** True only when the showroom has physically recorded this piece as in stock. */
export function isInShowroomStock(product: Product): boolean {
  return product.catalogueType === "showroom" && product.availability === "in_stock";
}

/** Human label for a style slug ("daily-wear" → "Daily wear"). */
export function styleLabel(style: string, lang: Lang): string {
  const known: Record<string, LocalizedText> = {
    temple: { en: "Temple", hi: "टेम्पल" },
    kundan: { en: "Kundan", hi: "कुंदन" },
    polki: { en: "Polki", hi: "पोल्की" },
    jadau: { en: "Jadau", hi: "जड़ाऊ" },
    antique: { en: "Antique", hi: "एंटीक" },
    bridal: { en: "Bridal", hi: "ब्राइडल" },
    minimal: { en: "Minimal", hi: "मिनिमल" },
    modern: { en: "Modern", hi: "मॉडर्न" },
    "daily-wear": { en: "Daily wear", hi: "रोज़ पहनने के लिए" },
    classic: { en: "Classic", hi: "क्लासिक" },
    diamond: { en: "Diamond", hi: "हीरा" },
    gemstone: { en: "Gemstone", hi: "रत्न" },
    fashion: { en: "Fashion", hi: "फैशन" },
    filigree: { en: "Filigree", hi: "फिलीग्री" },
  };
  const entry = known[style];
  if (entry) return pick(entry, lang);
  return style
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
