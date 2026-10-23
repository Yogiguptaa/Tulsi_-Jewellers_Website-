/**
 * admin/schema.ts — validation + FormData helpers for every /admin mutation.
 *
 * The rules match the database constraints in `supabase/schema.sql`, so a form
 * that passes here cannot be rejected by a CHECK/ENUM for being the wrong shape.
 * This module is plain TypeScript (no "use server"), so it can also be imported
 * by the client form components to show the same rules before submitting.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* FormData primitives                                                         */
/* -------------------------------------------------------------------------- */

/** A trimmed string field, "" when absent. */
export function text(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** An HTML checkbox: present means checked. */
export function checkbox(data: FormData, name: string): boolean {
  const value = data.get(name);
  return value === "on" || value === "true" || value === "1";
}

/** A number field; `null` when blank or not a finite number. */
export function optionalNumber(data: FormData, name: string): number | null {
  const raw = text(data, name);
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A required number; NaN when blank so zod surfaces "required". */
export function requiredNumber(data: FormData, name: string): number {
  const raw = text(data, name);
  if (raw === "") return Number.NaN;
  return Number(raw);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || UUID_RE.test(value), "Not a valid id.");

/** A URL that we are willing to store: http(s) or a site-relative path. */
export const imageRef = z
  .string()
  .trim()
  .max(800)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/"),
    "Images must be an http(s) URL or a path starting with /.",
  );

/* -------------------------------------------------------------------------- */
/* Enums (mirrors the DB enum types in src/lib/supabase/types.ts)              */
/* -------------------------------------------------------------------------- */

export const METALS = ["gold", "silver", "fashion", "gemstone"] as const;
export const PURITIES = ["24K", "22K", "20K", "18K", "14K", "925", "other"] as const;
export const AVAILABILITY = ["on_enquiry", "in_stock", "sold_out"] as const;
export const PRODUCT_STATUS = ["draft", "active", "archived"] as const;
export const JEWELRY_TYPES = [
  "rings",
  "necklaces",
  "earrings",
  "bangles",
  "bracelets",
  "chains",
  "pendants",
  "mangalsutra",
  "necklace-sets",
  "anklets",
  "coins-bars",
  "idols",
  "gemstones",
] as const;
export const GENDERS = ["women", "men", "kids", "unisex"] as const;
export const OCCASIONS = ["bridal", "daily", "festive", "gifting"] as const;
export const ENQUIRY_STATUS = ["new", "in_progress", "resolved", "closed"] as const;
export const REVIEW_STATUS = ["pending", "approved", "rejected"] as const;

/* -------------------------------------------------------------------------- */
/* Rates — manual IBJA benchmark entry                                         */
/* -------------------------------------------------------------------------- */

/** A rate as typed by the showroom. The publishable checks live in ingest.ts. */
export const manualRateSchema = z.object({
  metal: z.enum(["gold", "silver"]),
  purity: z.string().trim().regex(/^[0-9]{3}$/, "Purity must be a 3-digit fineness."),
  unit: z.enum(["INR_PER_10_GRAM", "INR_PER_KG"]),
  rate: z
    .number({ message: "Enter a number." })
    .finite("Enter a number.")
    .positive("A rate must be greater than zero."),
  session: z.enum(["AM", "PM", "unknown"]),
  gstIncluded: z.boolean(),
  makingChargesIncluded: z.boolean(),
});

export const rateEntrySchema = z.object({
  observedDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the observation date."),
  observedTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Pick the observation time."),
  session: z.enum(["AM", "PM"]),
  gstIncluded: z.boolean(),
  makingChargesIncluded: z.boolean(),
  sourceNote: z.string().trim().max(160).optional(),
  rates: z.array(manualRateSchema).min(1, "Enter at least one rate."),
});

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

export const productSchema = z.object({
  id: optionalUuid,
  code: z.string().trim().min(2, "A product code is required.").max(40),
  slug: z
    .string()
    .trim()
    .min(2, "A URL slug is required.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words joined by dashes."),
  category_id: z.string().trim().refine((value) => UUID_RE.test(value), "Choose a collection."),
  name_en: z.string().trim().min(2, "The English name is required.").max(160),
  name_hi: z.string().trim().min(2, "The Hindi name is required.").max(160),
  description_en: z.string().trim().max(4000).optional(),
  description_hi: z.string().trim().max(4000).optional(),
  metal: z.enum(METALS),
  purity: z.enum(PURITIES).or(z.literal("")).optional(),
  gemstone: z.string().trim().max(120).optional(),
  weight_grams: z.number().positive("Weight must be greater than zero.").max(1_000_000).nullable(),
  price_inr: z.number().positive("A price must be greater than zero.").max(1_000_000_000).nullable(),
  is_price_on_request: z.boolean(),
  availability: z.enum(AVAILABILITY),
  status: z.enum(PRODUCT_STATUS),
  is_featured: z.boolean(),
  jewelry_type: z.enum(JEWELRY_TYPES),
  gender: z.enum(GENDERS),
  occasion: z.enum(OCCASIONS),
  stone_detail: z.string().trim().max(400).optional(),
  sort_order: z.number().int().min(0).max(9999),
  images: z.array(
    z.object({
      url: imageRef,
      alt_en: z.string().trim().max(200).optional(),
      alt_hi: z.string().trim().max(200).optional(),
    }),
  ),
});

export type ProductInput = z.output<typeof productSchema>;

/** Parse the `images` textarea: one `url | alt EN | alt HI` per line. */
export function parseImageLines(raw: string): { url: string; alt_en: string; alt_hi: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url = "", altEn = "", altHi = ""] = line.split("|").map((part) => part.trim());
      return { url, alt_en: altEn, alt_hi: altHi };
    });
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export const categorySchema = z.object({
  id: optionalUuid,
  slug: z
    .string()
    .trim()
    .min(2, "A slug is required.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words joined by dashes."),
  name_en: z.string().trim().min(2, "The English name is required.").max(120),
  name_hi: z.string().trim().min(2, "The Hindi name is required.").max(120),
  description_en: z.string().trim().max(1000).optional(),
  description_hi: z.string().trim().max(1000).optional(),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Announcements / FAQs / reviews / pricing rules                              */
/* -------------------------------------------------------------------------- */

export const announcementSchema = z.object({
  id: optionalUuid,
  message_en: z.string().trim().min(2, "The English message is required.").max(300),
  message_hi: z.string().trim().min(2, "The Hindi message is required.").max(300),
  is_active: z.boolean(),
  starts_at: z.string().trim().max(40).optional(),
  ends_at: z.string().trim().max(40).optional(),
  sort_order: z.number().int().min(0).max(9999),
});

export const faqSchema = z.object({
  id: optionalUuid,
  question_en: z.string().trim().min(4, "The English question is required.").max(300),
  question_hi: z.string().trim().min(4, "The Hindi question is required.").max(300),
  answer_en: z.string().trim().min(4, "The English answer is required.").max(2000),
  answer_hi: z.string().trim().min(4, "The Hindi answer is required.").max(2000),
  category: z.string().trim().max(60).optional(),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export const reviewSchema = z.object({
  id: optionalUuid,
  author_name: z.string().trim().min(2, "The reviewer's name is required.").max(120),
  rating: z.number().int().min(1, "Choose 1–5 stars.").max(5),
  comment: z.string().trim().max(2000).optional(),
  /** Where the review actually came from — never invent the source. */
  source: z.string().trim().max(120).optional(),
  status: z.enum(REVIEW_STATUS),
});

export const pricingRuleSchema = z.object({
  id: optionalUuid,
  rule_key: z
    .string()
    .trim()
    .min(2, "A rule key is required.")
    .max(60)
    .regex(/^[a-z0-9_.-]+$/, "Use lowercase letters, digits, dot, dash or underscore."),
  label_en: z.string().trim().min(2, "The English label is required.").max(160),
  label_hi: z.string().trim().max(160).optional(),
  value: z.number().finite("Enter a number.").min(0, "Cannot be negative.").max(1_000_000),
  unit: z.string().trim().min(1, "A unit is required (e.g. percent, INR_PER_GRAM).").max(40),
  is_active: z.boolean(),
  is_public: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

/* -------------------------------------------------------------------------- */
/* Error formatting                                                            */
/* -------------------------------------------------------------------------- */

/** First issue per field, keyed by field name — for the form UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
