"use server";

/**
 * admin/actions.ts — every write the admin panel can perform.
 *
 * Rules that every action below obeys (this is the security boundary, `proxy.ts`
 * is only a UX redirect):
 *  1. Re-check the admin gate FIRST, on the server, before touching data.
 *  2. Validate with the shared Zod schema; a bad payload never reaches Postgres
 *     as a half-written row.
 *  3. Write with the *caller's own session* so RLS (`is_admin()`) applies — the
 *     service-role key is not used here at all.
 *  4. `owner`-only operations (deletes, pricing rules) are gated by role, matching
 *     the brief: "role staff cannot delete or change pricing rules".
 *  5. Return a short message. Never return an error object, a stack trace or a row
 *     to a caller who failed the gate.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { RATE_ROWS } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EnquiryStatus, ReviewStatus } from "@/lib/supabase/types";
import { EXPECTED_SERIES, providerStatuses, resolveProvider, type RawRate } from "@/lib/rates/providers";
import { classifyRate, maxJumpPct, validateRawRate } from "@/lib/rates/ingest";
import { runRateJob } from "@/lib/rates/run";
import { readUsage } from "@/lib/rates/usage";
import { getAdminGate, isOwner, type AdminIdentity } from "./auth";
import { fail, explainDbError, ok, type AdminActionResult } from "./result";
import {
  announcementSchema,
  categorySchema,
  checkbox,
  faqSchema,
  fieldErrors,
  optionalNumber,
  parseImageLines,
  pricingRuleSchema,
  productSchema,
  rateEntrySchema,
  requiredNumber,
  reviewSchema,
  text,
  ENQUIRY_STATUS,
  REVIEW_STATUS,
} from "./schema";

type Client = SupabaseClient<Database>;

/* -------------------------------------------------------------------------- */
/* Gate + plumbing                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Run `fn` only for a signed-in allowlisted admin. Returns a neutral failure
 * message for everyone else — the same wording regardless of *why* access was
 * refused, so the response cannot be used to probe for accounts.
 */
async function asAdmin(
  fn: (supabase: Client, admin: AdminIdentity) => Promise<AdminActionResult>,
  options: { ownerOnly?: boolean } = {},
): Promise<AdminActionResult> {
  const gate = await getAdminGate();

  if (gate.status === "unconfigured") {
    return fail("Supabase is not configured yet, so nothing was saved.");
  }
  if (gate.status !== "ok") {
    return fail("Your admin session is not valid. Sign in again, then retry.");
  }
  if (options.ownerOnly && !isOwner(gate.admin)) {
    return fail("Only the owner account may perform this action.");
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return fail("Supabase is not configured yet, so nothing was saved.");

  try {
    return await fn(supabase, gate.admin);
  } catch (error) {
    // Never surface a stack trace; log server-side for the developer.
    console.error("[admin] action failed", error);
    return fail(
      error instanceof Error ? explainDbError(error.message) : "Something went wrong. Nothing was changed.",
    );
  }
}

/** Invalidate the public caches a change affects. */
function publish(paths: string[], tags: string[]): void {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of new Set(paths)) revalidatePath(path);
}

function dbError(error: { message: string }): AdminActionResult {
  return fail(explainDbError(error.message));
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sign the current user out. Safe to call from any state.
 *
 * Returns void (not a result object) so it can be used directly as a `<form
 * action={…}>` handler without a wrapper component.
 */
export async function signOutAction(): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase?.auth.signOut();
  } catch {
    // The cookies may already be gone; falling through still signs the user out.
  }
  revalidatePath("/admin", "layout");
}

/* -------------------------------------------------------------------------- */
/* Rates — manual IBJA benchmark entry                                         */
/* -------------------------------------------------------------------------- */

/**
 * IST has no daylight saving, so a wall-clock reading from the showroom maps to a
 * fixed UTC+05:30 offset. Building the instant from the offset (rather than from
 * the *server's* timezone) means a deploy in a UTC region still records the time
 * the showroom actually read the rate.
 */
function istInstant(date: string, time: string): Date | null {
  const parsed = new Date(`${date}T${time}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveManualRates(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase, admin) => {
    const observedAt = istInstant(text(data, "observedDate"), text(data, "observedTime"));
    if (!observedAt) return fail("Pick a valid observation date and time.");

    const session: "AM" | "PM" = text(data, "session") === "PM" ? "PM" : "AM";
    const gstIncluded = checkbox(data, "gstIncluded");
    const makingChargesIncluded = checkbox(data, "makingChargesIncluded");
    const sourceNote = text(data, "sourceNote") || "IBJA benchmark (manual entry)";

    // Collect only the rows the operator actually filled in.
    const entries: RawRate[] = [];
    for (const row of RATE_ROWS) {
      const raw = text(data, `rate_${row.id}`);
      if (raw === "") continue;
      const value = Number(raw);
      entries.push({
        metal: row.metal,
        purity: row.fineness,
        unit: row.unit,
        rate: value,
        session,
        gstIncluded,
        makingChargesIncluded,
      });
    }

    const parsed = rateEntrySchema.safeParse({
      observedDate: text(data, "observedDate"),
      observedTime: text(data, "observedTime"),
      session,
      gstIncluded,
      makingChargesIncluded,
      sourceNote,
      rates: entries,
    });

    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      const first = Object.values(errors)[0] ?? "Check the values you entered.";
      return fail(first, errors);
    }

    // Reject anything the ingest validator would reject, so a typo can never
    // become a published benchmark. (Same rules as the cron path.)
    for (const rate of entries) {
      const verdict = validateRawRate(rate);
      if (!verdict.ok) {
        const label = RATE_ROWS.find(
          (row) => row.metal === rate.metal && row.fineness === String(rate.purity),
        )?.purityLabel;
        return fail(`${label ?? rate.purity}: ${verdict.reason}. Nothing was saved.`);
      }
    }

    const observedIso = observedAt.toISOString();
    const rows: {
      metal: RawRate["metal"];
      purity: string;
      unit: RawRate["unit"];
      rate: number;
      source: string;
      provider: string;
      observed_at: string;
      market_session: "AM" | "PM";
      gst_included: boolean;
      making_charges_included: boolean;
      approval_status: "auto" | "pending";
      approval_reason: string | null;
      delta_pct: number | null;
    }[] = [];
    let held = 0;

    // The same plausibility rule the scheduled feed obeys: a value that jumps
    // past the threshold is stored but withheld from the public site until
    // someone approves it. A mistyped number is exactly as damaging as a bad
    // payload, so it gets the same gate.
    for (const rate of entries) {
      const classification = await classifyRate(supabase as unknown as SupabaseClient, rate);
      if (classification.status === "pending") held += 1;
      rows.push({
        metal: rate.metal,
        purity: String(rate.purity),
        unit: rate.unit,
        rate: rate.rate,
        source: sourceNote,
        provider: "manual",
        observed_at: observedIso,
        market_session: session,
        gst_included: gstIncluded,
        making_charges_included: makingChargesIncluded,
        approval_status: classification.status,
        approval_reason: classification.reason,
        delta_pct: classification.deltaPct,
      });
    }

    const { error } = await supabase.from("metal_rates").insert(rows);
    if (error) return fail(explainRateWriteError(error.message));

    // Audit trail, in the same table the cron writes to. A failure here is
    // reported rather than swallowed: publishing a rate with no log entry is
    // exactly the kind of gap an audit trail exists to prevent.
    const { error: logError } = await supabase.from("rate_job_logs").insert({
      job: "manual-entry",
      status: "success",
      message:
        `${rows.length} rate(s) recorded by ${admin.email} for ${observedIso}` +
        (held > 0 ? ` — ${held} held for approval` : ""),
      rows_affected: rows.length,
      duration_ms: null,
    });

    publish(["/admin", "/admin/rates", "/rates", "/rates/history", "/"], ["rates"]);
    const note = logError
      ? " The audit-log entry could not be written — run supabase/migrations/2026-10-11_stage-8_admin_audit_log.sql."
      : "";
    const published = rows.length - held;
    return ok(
      `${published} of ${rows.length} rate(s) published.` +
        (held > 0
          ? ` ${held} value(s) move more than ${maxJumpPct()}% against the last published value, so they are held ` +
            "back until you approve them on this page. The site is still showing the previous value."
          : " The site now shows them.") +
        note,
    );
  });
}

/**
 * Approve a value the plausibility check held back. Approving PUBLISHES it to the
 * site immediately, which is why the reviewer's email and the moment are stored
 * on the row and written to the job log.
 */
export async function approveRate(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return reviewRate(data, "approved");
}

/** Reject a held value: it stays in the database as a record, never on the site. */
export async function rejectRate(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return reviewRate(data, "rejected");
}

/**
 * "Run now" — the same job the daily schedule runs, started by a signed-in
 * admin. It obeys every rule of the scheduled run: one call at most, skipped if
 * today's rates already exist, and never a value that fails validation. The
 * provider key stays on the server; only counts and reasons come back.
 */
export async function runRateJobNow(): Promise<AdminActionResult> {
  return asAdmin(async () => {
    const summary = await runRateJob();
    // A newly stored value (or an approval) must be visible on the next request.
    revalidateTag("rates", { expire: 0 });
    if (!summary.ok) return fail(summary.message);
    return ok(
      summary.skipped
        ? `Nothing was fetched: ${summary.message}`
        : `${summary.provider} — ${summary.message}`,
    );
  });
}

async function reviewRate(
  data: FormData,
  decision: "approved" | "rejected",
): Promise<AdminActionResult> {
  return asAdmin(async (supabase, admin) => {
    const id = text(data, "id");
    if (!id) return fail("Missing rate id.");

    // Only a held row can be reviewed, so double-approving cannot rewrite a
    // value that is already live.
    const { data: updated, error } = await supabase
      .from("metal_rates")
      .update({
        approval_status: decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.email,
      })
      .eq("id", id)
      .eq("approval_status", "pending")
      .select("id");

    if (error) return fail(explainRateWriteError(error.message));
    if (!updated || updated.length === 0) {
      return fail("That value is no longer awaiting approval, so nothing was changed.");
    }

    const { error: logError } = await supabase.from("rate_job_logs").insert({
      job: "rate-approval",
      status: "success",
      message: `Rate ${id} ${decision} by ${admin.email}`,
      rows_affected: 1,
      duration_ms: null,
    });

    publish(["/admin", "/admin/rates", "/rates", "/rates/history", "/"], ["rates"]);
    const note = logError ? " (The audit-log entry could not be written.)" : "";
    return ok(
      decision === "approved"
        ? `Rate approved and published.${note}`
        : `Rate rejected — it stays in the record but is never shown to customers.${note}`,
    );
  });
}

/** A missing Stage 11 column must produce instructions, not a raw Postgres error. */
function explainRateWriteError(message: string): string {
  if (/approval_status|approval_reason|delta_pct|reviewed_/i.test(message)) {
    return (
      "The rate tables have not been upgraded for approval workflow yet — run " +
      "supabase/migrations/2026-10-15_stage-11_rate_provider_governance.sql, then try again. " +
      "Nothing was saved."
    );
  }
  return explainDbError(message);
}

export async function deleteRate(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing rate id.");

    const { error } = await supabase.from("metal_rates").delete().eq("id", id);
    if (error) return dbError(error);

    const { error: logError } = await supabase.from("rate_job_logs").insert({
      job: "manual-entry",
      status: "success",
      message: `Rate ${id} removed from the history`,
      rows_affected: 1,
      duration_ms: null,
    });

    publish(["/admin/rates", "/rates", "/rates/history", "/"], ["rates"]);
    return ok(
      logError
        ? "Rate removed (the audit-log entry could not be written)."
        : "Rate removed, and the removal was logged.",
    );
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

function productFromForm(data: FormData) {
  return {
    id: text(data, "id"),
    code: text(data, "code"),
    slug: text(data, "slug"),
    category_id: text(data, "category_id"),
    name_en: text(data, "name_en"),
    name_hi: text(data, "name_hi"),
    description_en: text(data, "description_en"),
    description_hi: text(data, "description_hi"),
    metal: text(data, "metal"),
    purity: text(data, "purity"),
    gemstone: text(data, "gemstone"),
    weight_grams: optionalNumber(data, "weight_grams"),
    price_inr: optionalNumber(data, "price_inr"),
    is_price_on_request: checkbox(data, "is_price_on_request"),
    availability: text(data, "availability"),
    status: text(data, "status"),
    is_featured: checkbox(data, "is_featured"),
    jewelry_type: text(data, "jewelry_type"),
    gender: text(data, "gender"),
    occasion: text(data, "occasion"),
    stone_detail: text(data, "stone_detail"),
    sort_order: optionalNumber(data, "sort_order") ?? 0,
    images: parseImageLines(text(data, "images")),
  };
}

export async function saveProduct(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const parsed = productSchema.safeParse(productFromForm(data));
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return fail(Object.values(errors)[0] ?? "Check the highlighted fields.", errors);
    }
    const input = parsed.data;

    // "Price on request" and a stored price are mutually exclusive: a price the
    // showroom has not confirmed must never be shown. Clear it rather than lie.
    const priceINR = input.is_price_on_request ? null : input.price_inr;
    if (!input.is_price_on_request && priceINR === null) {
      return fail("Enter a price, or tick “Price on request”.", { price_inr: "Required." });
    }

    const values = {
      code: input.code,
      slug: input.slug,
      category_id: input.category_id,
      name_en: input.name_en,
      name_hi: input.name_hi,
      description_en: input.description_en || null,
      description_hi: input.description_hi || null,
      metal: input.metal,
      purity: input.purity ? input.purity : null,
      gemstone: input.gemstone || null,
      weight_grams: input.weight_grams,
      price_inr: priceINR,
      is_price_on_request: input.is_price_on_request,
      availability: input.availability,
      status: input.status,
      is_featured: input.is_featured,
      jewelry_type: input.jewelry_type,
      gender: input.gender,
      occasion: input.occasion,
      stone_detail: input.stone_detail || null,
      sort_order: input.sort_order,
    };

    let productId = input.id;

    if (productId) {
      const { error } = await supabase.from("products").update(values).eq("id", productId);
      if (error) return dbError(error);
    } else {
      const { data: inserted, error } = await supabase
        .from("products")
        .insert(values)
        .select("id")
        .single();
      if (error) return dbError(error);
      productId = inserted.id;
    }

    // Images are replaced wholesale: the textarea is the source of truth, so a
    // removed line really disappears instead of lingering in the gallery.
    const { error: clearError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    if (clearError) return dbError(clearError);

    if (input.images.length > 0) {
      const { error: imageError } = await supabase.from("product_images").insert(
        input.images.map((image, index) => ({
          product_id: productId,
          url: image.url,
          alt_en: image.alt_en || input.name_en,
          alt_hi: image.alt_hi || input.name_hi,
          position: index,
          is_primary: index === 0,
        })),
      );
      if (imageError) return dbError(imageError);
    }

    publish(
      ["/admin", "/admin/products", "/collections", "/", `/products/${input.slug}`],
      ["catalogue"],
    );
    return ok(
      input.status === "active"
        ? "Saved. This product is live on the site."
        : `Saved as ${input.status}. It is not visible to visitors yet.`,
    );
  });
}

export async function setProductStatus(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    const status = text(data, "status");
    if (!id || !["draft", "active", "archived"].includes(status)) {
      return fail("Unknown product or status.");
    }
    const { error } = await supabase
      .from("products")
      .update({ status: status as "draft" | "active" | "archived" })
      .eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/products", "/collections", "/"], ["catalogue"]);
    return ok(status === "active" ? "Product published." : `Product set to ${status}.`);
  });
}

export async function deleteProduct(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing product id.");
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin", "/admin/products", "/collections", "/"], ["catalogue"]);
    return ok("Product deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function saveCategory(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const parsed = categorySchema.safeParse({
      id: text(data, "id"),
      slug: text(data, "slug"),
      name_en: text(data, "name_en"),
      name_hi: text(data, "name_hi"),
      description_en: text(data, "description_en"),
      description_hi: text(data, "description_hi"),
      sort_order: optionalNumber(data, "sort_order") ?? 0,
      is_active: checkbox(data, "is_active"),
    });
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return fail(Object.values(errors)[0] ?? "Check the highlighted fields.", errors);
    }
    const input = parsed.data;
    const values = {
      slug: input.slug,
      name_en: input.name_en,
      name_hi: input.name_hi,
      description_en: input.description_en || null,
      description_hi: input.description_hi || null,
      sort_order: input.sort_order,
      is_active: input.is_active,
    };

    if (input.id) {
      const { error } = await supabase.from("categories").update(values).eq("id", input.id);
      if (error) return dbError(error);
    } else {
      const { error } = await supabase.from("categories").insert(values);
      if (error) return dbError(error);
    }

    publish(["/admin/categories", "/collections", "/"], ["catalogue"]);
    return ok("Collection saved.");
  });
}

export async function deleteCategory(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing collection id.");

    // Refuse rather than cascade: deleting a collection must never silently take
    // a product with it. The operator moves the products first.
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if (count && count > 0) {
      return fail(`This collection still has ${count} product(s). Move or delete them first.`);
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/categories", "/collections"], ["catalogue"]);
    return ok("Collection deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export async function setEnquiryStatus(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    const status = text(data, "status");
    const scheme = text(data, "table") === "scheme_enquiries";
    if (!id || !ENQUIRY_STATUS.includes(status as EnquiryStatus)) {
      return fail("Unknown enquiry or status.");
    }
    const value = status as EnquiryStatus;
    const { error } = scheme
      ? await supabase.from("scheme_enquiries").update({ status: value }).eq("id", id)
      : await supabase.from("enquiries").update({ status: value }).eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/enquiries"], []);
    return ok("Status updated.");
  });
}

export async function deleteEnquiry(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    const scheme = text(data, "table") === "scheme_enquiries";
    if (!id) return fail("Missing enquiry id.");
    const { error } = scheme
      ? await supabase.from("scheme_enquiries").delete().eq("id", id)
      : await supabase.from("enquiries").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/enquiries"], []);
    return ok("Enquiry deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Announcements                                                               */
/* -------------------------------------------------------------------------- */

export async function saveAnnouncement(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const parsed = announcementSchema.safeParse({
      id: text(data, "id"),
      message_en: text(data, "message_en"),
      message_hi: text(data, "message_hi"),
      is_active: checkbox(data, "is_active"),
      starts_at: text(data, "starts_at"),
      ends_at: text(data, "ends_at"),
      sort_order: optionalNumber(data, "sort_order") ?? 0,
    });
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return fail(parsed.error.issues[0]?.message ?? "Check the fields.", errors);
    }
    const input = parsed.data;

    // A blank datetime means "no bound", which the column allows.
    const values = {
      message_en: input.message_en,
      message_hi: input.message_hi,
      is_active: input.is_active,
      starts_at: input.starts_at ? new Date(input.starts_at).toISOString() : null,
      ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
      sort_order: input.sort_order,
    };

    if (input.id) {
      const { error } = await supabase.from("announcements").update(values).eq("id", input.id);
      if (error) return dbError(error);
    } else {
      const { error } = await supabase.from("announcements").insert(values);
      if (error) return dbError(error);
    }

    publish(["/admin/announcements", "/"], ["announcements"]);
    return ok("Announcement saved.");
  });
}

export async function deleteAnnouncement(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing announcement id.");
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/announcements", "/"], ["announcements"]);
    return ok("Announcement deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* FAQs                                                                        */
/* -------------------------------------------------------------------------- */

export async function saveFaq(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const parsed = faqSchema.safeParse({
      id: text(data, "id"),
      question_en: text(data, "question_en"),
      question_hi: text(data, "question_hi"),
      answer_en: text(data, "answer_en"),
      answer_hi: text(data, "answer_hi"),
      category: text(data, "category"),
      sort_order: optionalNumber(data, "sort_order") ?? 0,
      is_active: checkbox(data, "is_active"),
    });
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return fail(Object.values(errors)[0] ?? "Check the fields.", errors);
    }
    const input = parsed.data;
    const values = {
      question_en: input.question_en,
      question_hi: input.question_hi,
      answer_en: input.answer_en,
      answer_hi: input.answer_hi,
      category: input.category || null,
      sort_order: input.sort_order,
      is_active: input.is_active,
    };

    if (input.id) {
      const { error } = await supabase.from("faqs").update(values).eq("id", input.id);
      if (error) return dbError(error);
    } else {
      const { error } = await supabase.from("faqs").insert(values);
      if (error) return dbError(error);
    }

    publish(["/admin/faqs", "/faq"], ["faqs"]);
    return ok("FAQ saved.");
  });
}

export async function deleteFaq(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing FAQ id.");
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/faqs", "/faq"], ["faqs"]);
    return ok("FAQ deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveReview(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const parsed = reviewSchema.safeParse({
      id: text(data, "id"),
      author_name: text(data, "author_name"),
      rating: optionalNumber(data, "rating") ?? Number.NaN,
      comment: text(data, "comment"),
      source: text(data, "source"),
      status: text(data, "status"),
    });
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return fail(Object.values(errors)[0] ?? "Check the fields.", errors);
    }
    const input = parsed.data;
    const values = {
      author_name: input.author_name,
      rating: input.rating,
      comment: input.comment || null,
      source: input.source || null,
      status: input.status,
    };

    if (input.id) {
      const { error } = await supabase.from("reviews").update(values).eq("id", input.id);
      if (error) return dbError(error);
    } else {
      const { error } = await supabase.from("reviews").insert(values);
      if (error) return dbError(error);
    }

    publish(["/admin/reviews", "/"], ["reviews"]);
    return ok(
      input.status === "approved"
        ? "Review saved and published."
        : "Review saved (not shown on the site yet).",
    );
  });
}

export async function setReviewStatus(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    const status = text(data, "status");
    if (!id || !REVIEW_STATUS.includes(status as ReviewStatus)) {
      return fail("Unknown review or status.");
    }
    const { error } = await supabase
      .from("reviews")
      .update({ status: status as ReviewStatus })
      .eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/reviews", "/"], ["reviews"]);
    return ok(status === "approved" ? "Review approved." : `Review ${status}.`);
  });
}

export async function deleteReview(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing review id.");
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/reviews", "/"], ["reviews"]);
    return ok("Review deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Pricing rules (owner only — public visibility is a pricing decision)         */
/* -------------------------------------------------------------------------- */

export async function savePricingRule(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const parsed = pricingRuleSchema.safeParse({
      id: text(data, "id"),
      rule_key: text(data, "rule_key"),
      label_en: text(data, "label_en"),
      label_hi: text(data, "label_hi"),
      value: requiredNumber(data, "value"),
      unit: text(data, "unit"),
      is_active: checkbox(data, "is_active"),
      is_public: checkbox(data, "is_public"),
      notes: text(data, "notes"),
    });
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return fail(Object.values(errors)[0] ?? "Check the fields.", errors);
    }
    const input = parsed.data;
    const values = {
      rule_key: input.rule_key,
      label_en: input.label_en,
      label_hi: input.label_hi || null,
      value: input.value,
      unit: input.unit,
      is_active: input.is_active,
      is_public: input.is_public,
      notes: input.notes || null,
    };

    if (input.id) {
      const { error } = await supabase.from("pricing_rules").update(values).eq("id", input.id);
      if (error) return dbError(error);
    } else {
      const { error } = await supabase.from("pricing_rules").insert(values);
      if (error) return dbError(error);
    }

    publish(["/admin/pricing-rules", "/rates/calculator", "/rates"], ["pricing"]);
    return ok(
      input.is_public
        ? "Rule saved. It is now shown on the public pages that use it."
        : "Rule saved (internal only).",
    );
  }, { ownerOnly: true });
}

export async function deletePricingRule(
  _prev: AdminActionResult,
  data: FormData,
): Promise<AdminActionResult> {
  return asAdmin(async (supabase) => {
    const id = text(data, "id");
    if (!id) return fail("Missing rule id.");
    const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
    if (error) return dbError(error);
    publish(["/admin/pricing-rules", "/rates/calculator"], ["pricing"]);
    return ok("Rule deleted.");
  }, { ownerOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Diagnostics                                                                 */
/* -------------------------------------------------------------------------- */

export type HealthCheck = {
  label: string;
  state: "ok" | "warn" | "error" | "info";
  detail: string;
};

/**
 * Rate-provider health, shown on the dashboard. Reads through the *session*
 * client so RLS decides what is visible; a failed query is reported honestly
 * instead of being treated as "no data".
 */
export async function rateHealth(): Promise<HealthCheck[]> {
  const gate = await getAdminGate();
  if (gate.status !== "ok") return [];
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const checks: HealthCheck[] = [];
  const series = EXPECTED_SERIES.length;
  const resolution = resolveProvider();
  const provider = resolution.active;
  // Never the key itself — only whether one is present, and the endpoint host.
  const feedStatus = provider.kind === "external" ? providerStatuses()[0] : null;
  const hasKey = feedStatus?.hasKey ?? false;
  const endpoint = feedStatus?.endpointHost ?? null;

  // --- Which feed is switched on, and can it run at all? ---------------------
  if (resolution.problem) {
    checks.push({
      label: "Rate feed",
      state: resolution.requested === "external" ? "error" : "info",
      detail: resolution.problem,
    });
  } else if (provider.kind === "external") {
    checks.push({
      label: "Rate feed",
      state: "ok",
      detail:
        `${provider.label}. API key ${hasKey ? "set" : "missing"}` +
        `${endpoint ? ` · ${endpoint}` : ""} · ` +
        (provider.publication === "intraday"
          ? "updates through the day, so a fresh value may be labelled Live."
          : "a PUBLISHED benchmark, so the site says “Latest published rate” and never “Live”.") +
        ` Poll no more often than every ${provider.refreshMinutes ?? 60} minutes.`,
    });
  } else {
    checks.push({
      label: "Rate feed",
      state: "info",
      detail:
        "Manual entry — nothing is fetched automatically and no value is ever generated. " +
        "Set RATE_PROVIDER=external with RATE_API_URL and RATE_API_KEY to use a licensed feed.",
    });
  }

  // --- Automatic feed: when does it next run, and what has it spent? ---------
  if (provider.recordAs === "metalsdev") {
    checks.push({
      label: "Next automatic run",
      state: "info",
      detail:
        "Daily at 09:30 IST (04:00 UTC) from vercel.json, plus the GitHub Actions workflow at " +
        "04:00 and 05:00 UTC as a safety net. A run that finds today's values already stored does " +
        "nothing and spends no API call.",
    });

    const usage = await readUsage(supabase as unknown as SupabaseClient, provider.recordAs);
    if (usage && !usage.tracked) {
      checks.push({
        label: "API calls used",
        state: "info",
        detail:
          "Not tracked yet — run supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql " +
          "to count calls against RATE_API_MONTHLY_LIMIT.",
      });
    } else if (usage) {
      checks.push({
        label: "API calls used",
        state: usage.blocked ? "warn" : "ok",
        detail:
          `${usage.calls} of ${usage.limit} calls used in ${usage.month}` +
          (usage.blocked
            ? ". The job has stopped before spending the last 10% of the allowance, so the previously stored rate is being shown."
            : "."),
      });
    }
  }

  // --- How old is what customers are seeing? ---------------------------------
  // A published benchmark is allowed a weekend-sized gap; an intraday feed is
  // not, so the tolerance follows the provider's own cadence.
  const toleranceHours =
    provider.publication === "intraday" ? Math.max((4 * (provider.refreshMinutes ?? 15)) / 60, 2) : 48;

  const publishedOnly = () =>
    supabase
      .from("metal_rates")
      .select("observed_at, source")
      .in("approval_status", ["auto", "approved"])
      .order("observed_at", { ascending: false })
      .limit(1);

  let { data: latest, error: latestError } = await publishedOnly();
  if (latestError && /approval_status|does not exist|schema cache/i.test(latestError.message)) {
    // Before the Stage 11 migration no row can be pending, so the unfiltered
    // read reports the same thing without failing the panel.
    ({ data: latest, error: latestError } = await supabase
      .from("metal_rates")
      .select("observed_at, source")
      .order("observed_at", { ascending: false })
      .limit(1));
  }

  if (latestError) {
    checks.push({ label: "Data age", state: "error", detail: latestError.message });
  } else if (!latest || latest.length === 0) {
    checks.push({
      label: "Data age",
      state: "warn",
      detail: "No rate has ever been recorded. The site shows “Latest verified rate temporarily unavailable”.",
    });
  } else {
    const observed = new Date(latest[0].observed_at).getTime();
    const ageHours = Math.max(0, Math.round((Date.now() - observed) / 3_600_000));
    checks.push({
      label: "Data age",
      state: ageHours > toleranceHours ? "warn" : "ok",
      detail:
        ageHours > toleranceHours
          ? `The latest published value is ${ageHours} h old — older than the ${Math.round(toleranceHours)} h this feed should go before someone looks at it. It is from ${latest[0].source}, and the site is showing it with its own date.`
          : `Latest published value is ${ageHours} h old, from ${latest[0].source}.`,
    });
  }

  // --- Anything waiting for a human? ----------------------------------------
  const { count: pendingCount } = await supabase
    .from("metal_rates")
    .select("id", { count: "exact", head: true })
    .eq("approval_status", "pending");
  if (pendingCount && pendingCount > 0) {
    checks.push({
      label: "Awaiting approval",
      state: "warn",
      detail:
        `${pendingCount} value(s) were flagged as an implausible jump and are NOT on the site. ` +
        "Approve or reject them on the Rates page — the previous published value is being shown until then.",
    });
  }

  // --- Assumptions the owner still has to confirm ---------------------------
  const assumptions = resolution.mapper ? resolution.mapper.assumptions : [];
  if (assumptions.length > 0) {
    checks.push({
      label: "Provider mapping to confirm",
      state: "warn",
      detail:
        `${assumptions.length} assumption(s) behind ${resolution.mapper?.label} are recorded in the mapper. ` +
        `First: ${assumptions[0]} Confirm it, then remove the entry from the mapper's \`assumptions\` list. ` +
        "See docs/RATE_PROVIDER.md.",
    });
  }

  const { count: rowCount } = await supabase
    .from("metal_rates")
    .select("id", { count: "exact", head: true });
  checks.push({
    label: "Benchmark series",
    state: rowCount ? "info" : "warn",
    detail: `${rowCount ?? 0} stored observations across ${series} tracked series.`,
  });

  const { data: logs } = await supabase
    .from("rate_job_logs")
    .select("status, message, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  const last = logs?.[0];
  checks.push(
    last
      ? {
          label: "Last rate job",
          state: last.status === "error" ? "error" : "ok",
          detail: `${last.status} · ${new Date(last.created_at).toISOString()} · ${last.message ?? ""}`,
        }
      : { label: "Last rate job", state: "info", detail: "No job has run yet." },
  );

  // The privileged client is only touched to report whether the *optional*
  // scheduled path is available. It never performs a write here.
  const canStore = Boolean(getSupabaseAdminClient());
  checks.push({
    label: "Scheduled job credentials",
    state: canStore ? "ok" : "info",
    detail: canStore
      ? "SUPABASE_SERVICE_ROLE_KEY is set, so the cron ingest can store values. The job also needs CRON_SECRET, or it refuses to run."
      : "No service-role key. Manual entry still works; the scheduled ingest cannot store anything.",
  });

  return checks;
}
