/**
 * enquiries/schema.ts — validation for every enquiry form on the site.
 *
 * The same schema runs in the browser (instant feedback) and in the API route
 * (authoritative). Keeping one schema means the two can never drift apart.
 */

import { z } from "zod";

/** Indian numbers with optional country code, spaces or dashes. */
const PHONE = /^\+?[0-9][0-9\s-]{6,19}$/;
/** Deliberately simple: real validation happens by replying to the address. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const ENQUIRY_KINDS = ["general", "product", "scheme", "visit", "custom"] as const;

export const enquirySchema = z.object({
  kind: z.enum(ENQUIRY_KINDS).default("general"),
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "That name is too long."),
  phone: z
    .string()
    .trim()
    .regex(PHONE, "Please enter a phone number we can reach you on."),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => value === "" || EMAIL.test(value), "Please check the email address."),
  message: z
    .string()
    .trim()
    .min(5, "Please add a short message.")
    .max(4000, "Please keep the message under 4000 characters."),
  /** Optional context: product code, scheme amount, preferred visit day. */
  productCode: z.string().trim().max(40).optional(),
  monthlyAmount: z.coerce.number().positive().max(10_000_000).optional(),
  preferredVisit: z.string().trim().max(120).optional(),
  /** Honeypot: accept anything so the route can answer a bot with a normal-looking
   * success and store nothing, instead of teaching it which field failed. */
  website: z.string().max(300).optional(),
  /** Set when the visitor ticked "I agree to be contacted". */
  consent: z.boolean().optional(),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/** Field-level errors keyed by field name, for the form UI. */
export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

export function collectErrors(error: z.ZodError<Enquiry>): EnquiryErrors {
  const errors: EnquiryErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof Enquiry] = issue.message;
    }
  }
  return errors;
}
