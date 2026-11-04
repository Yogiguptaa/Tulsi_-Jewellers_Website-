/**
 * catalogue/static.ts — the static JSON catalogue.
 *
 * WHY A JSON FILE
 * ───────────────
 * The catalogue is the one thing that must never be down. Reading it from a
 * checked-in JSON file means a page render needs no database, no supplier API and
 * no network call at all: the site keeps working when everything else fails, and
 * the free hosting plan stays free.
 *
 * The file is generated from a CSV by `scripts/import-products.mjs`, which
 * validates every row before writing. This module is the second gate: it checks
 * the stored shape again at read time, and anything that does not match is
 * dropped and reported rather than rendered half-parsed. A product that fails
 * validation is never shown to a customer.
 *
 * SERVER-ONLY. Client components receive the parsed products as props.
 */

import { z } from "zod";
import raw from "@/content/catalogue/products.json";
import type { Product } from "./types";

const localized = z.object({
  en: z.string().trim().min(1),
  hi: z.string().trim().min(1),
});

const supplierSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ref: z.string().trim().max(80).nullable().default(null),
  url: z.string().trim().max(300).nullable().default(null),
});

const productSchema = z
  .object({
    code: z.string().trim().min(2).max(40),
    slug: z
      .string()
      .trim()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase words joined by hyphens"),
    name: localized,
    description: localized,
    categorySlug: z.string().trim().min(1).max(60),
    type: z.string().trim().min(1).max(40),
    style: z.string().trim().max(40).nullable().default(null),
    metal: z.enum(["gold", "silver", "fashion", "gemstone"]),
    purity: z.enum(["24K", "22K", "20K", "18K", "14K", "925", "other"]).nullable().default(null),
    gender: z.enum(["women", "men", "kids", "unisex"]),
    occasion: z.enum(["bridal", "daily", "festive", "gifting"]),
    weightGrams: z.number().positive().max(100000).nullable().default(null),
    gemstone: z.string().trim().max(40).nullable().default(null),
    stoneDetail: z.string().trim().max(400).nullable().default(null),
    priceType: z.enum(["on_enquiry", "fixed", "rate_based", "unavailable"]),
    priceINR: z.number().nonnegative().max(100000000).nullable().default(null),
    availability: z.enum(["on_enquiry", "in_stock", "sold_out"]),
    isFeatured: z.boolean().default(false),
    createdAt: z.string().min(1),
    imageKeys: z.array(z.string().trim().min(1)).max(8),
    specs: z
      .array(z.object({ label: localized, value: z.string().trim().min(1).max(120) }))
      .max(12)
      .default([]),
    catalogueType: z.enum(["showroom", "inspiration", "supplier"]),
    supplier: supplierSchema.nullable().default(null),
    lastUpdated: z.string().min(1),
  })
  // The provenance rules, enforced on read as well as on import.
  .superRefine((product, ctx) => {
    if (product.catalogueType !== "showroom" && product.availability === "in_stock") {
      ctx.addIssue({
        code: "custom",
        path: ["availability"],
        message: "only a showroom piece may be recorded as in stock",
      });
    }
    if (product.catalogueType !== "showroom" && product.priceINR !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["priceINR"],
        message: "an inspiration or supplier design may not carry a fixed price",
      });
    }
    if (product.catalogueType === "supplier" && !product.supplier) {
      ctx.addIssue({
        code: "custom",
        path: ["supplier"],
        message: "a supplier design must name its supplier",
      });
    }
    if (product.priceType === "fixed" && product.priceINR === null) {
      ctx.addIssue({
        code: "custom",
        path: ["priceINR"],
        message: "priceType fixed requires a price",
      });
    }
  });

const fileSchema = z.object({
  version: z.literal(1),
  products: z.array(z.unknown()),
});

export type StaticCatalogue = {
  products: Product[];
  /** Rows present in the file that failed validation (never rendered). */
  rejected: Array<{ index: number; reason: string }>;
};

let cached: StaticCatalogue | null = null;

/**
 * Parsed once per server process. Reading and validating 200 rows is a few
 * milliseconds, but there is no reason to repeat it on every request.
 */
export function loadStaticCatalogue(): StaticCatalogue {
  if (cached) return cached;

  const file = fileSchema.safeParse(raw);
  if (!file.success) {
    // A malformed file is a build/deploy mistake, not a customer problem: the
    // site falls back to whatever else is available and never throws.
    cached = {
      products: [],
      rejected: [{ index: -1, reason: "products.json is not the expected shape (version 1)" }],
    };
    return cached;
  }

  const products: Product[] = [];
  const rejected: StaticCatalogue["rejected"] = [];
  const seenCodes = new Set<string>();
  const seenSlugs = new Set<string>();

  file.data.products.forEach((entry, index) => {
    const parsed = productSchema.safeParse(entry);
    if (!parsed.success) {
      rejected.push({
        index,
        reason: parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("; "),
      });
      return;
    }
    const product = parsed.data as Product;
    const code = product.code.toLowerCase();
    if (seenCodes.has(code)) {
      rejected.push({ index, reason: `duplicate product code ${product.code}` });
      return;
    }
    if (seenSlugs.has(product.slug)) {
      rejected.push({ index, reason: `duplicate slug ${product.slug}` });
      return;
    }
    seenCodes.add(code);
    seenSlugs.add(product.slug);
    products.push(product);
  });

  if (rejected.length > 0) {
    // Names and reasons only — no product content is logged.
    console.warn(
      `[catalogue] ${rejected.length} row(s) in products.json were not publishable: ` +
        rejected.map((entry) => `#${entry.index} ${entry.reason}`).join(" | "),
    );
  }

  cached = { products, rejected };
  return cached;
}
