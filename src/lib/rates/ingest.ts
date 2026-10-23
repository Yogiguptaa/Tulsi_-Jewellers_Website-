/**
 * rates/ingest.ts — validate, store and log rate updates. SERVER-ONLY.
 *
 * Guarantees (the "never show a fake rate" rules):
 *  • a value is only stored if the source, provider timestamp, metal, purity,
 *    unit, currency and number all check out, and the number is inside a
 *    plausible band
 *  • a value that clears those checks but jumps more than
 *    RATE_MAX_JUMP_PCT (default 6%) against the last published value for the
 *    same series is STORED AS PENDING: it is not shown on the public site until
 *    a human approves it in the admin panel. A flagged value is never silently
 *    accepted, and the flag is recorded with the number that caused it
 *  • a failed validation NEVER overwrites or deletes the last good value — the
 *    UI keeps showing the previous verified rate with its own timestamp
 *  • every run writes a row to `rate_job_logs`, so the admin panel can show
 *    "last successful update" and "last failed update"
 */

import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  appendLocalJobLog,
  insertLocalRate,
  localStoreAvailable,
  readLocalPreviousValue,
} from "./localStore";
import { EXPECTED_SERIES, type ProviderFetchResult, type RawRate, type RateProvider } from "./providers";
import type { MarketSession, RateObservation } from "./types";

export type RejectedRate = { raw: RawRate; reason: string };

export type IngestSummary = {
  ok: boolean;
  provider: string;
  inserted: number;
  duplicates: number;
  /** Stored but withheld from the public site until approved in admin. */
  pending: number;
  rejected: RejectedRate[];
  /** Non-fatal notes from the mapper (unit conversion, declared unit, …). */
  notes: string[];
  message: string;
};

/**
 * Sanity bands in INR. Far outside these means the payload is in the wrong unit
 * or the wrong metal — the classic failure being a per-troy-ounce figure read as
 * a per-10-gram rate. Deliberately wide enough to survive years of price rises,
 * narrow enough to catch a unit or decimal-point mistake.
 */
const SANITY: Record<string, { min: number; max: number }> = {
  "gold:INR_PER_10_GRAM": { min: 10_000, max: 300_000 },
  "silver:INR_PER_KG": { min: 25_000, max: 500_000 },
};

/** A jump bigger than this (absolute %) needs a human before it goes public. */
const DEFAULT_MAX_JUMP_PCT = 6;
/** Reject observations older than this many days, or dated in the future. */
const DEFAULT_MAX_AGE_DAYS = 7;
/** Allowance for a provider clock running slightly ahead of ours. */
const FUTURE_TOLERANCE_MINUTES = 15;

function numericEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return fallback;
  return value;
}

export function maxJumpPct(): number {
  // 0 would flag every movement and 100 would flag nothing interesting; the
  // clamp keeps a mistyped environment variable from disabling the guard.
  return numericEnv("RATE_MAX_JUMP_PCT", DEFAULT_MAX_JUMP_PCT, 0.1, 50);
}

export function maxAgeDays(): number {
  return numericEnv("RATE_MAX_AGE_DAYS", DEFAULT_MAX_AGE_DAYS, 1, 30);
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export function validateRawRate(raw: RawRate): { ok: true } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "not an object" };
  if (raw.metal !== "gold" && raw.metal !== "silver") return { ok: false, reason: "unknown metal" };
  if (typeof raw.rate !== "number" || !Number.isFinite(raw.rate)) return { ok: false, reason: "rate is not a number" };
  if (raw.rate <= 0) return { ok: false, reason: "rate must be greater than 0" };
  if (raw.unit !== "INR_PER_10_GRAM" && raw.unit !== "INR_PER_KG") {
    return { ok: false, reason: "unsupported unit" };
  }
  const expected = EXPECTED_SERIES.find(
    (series) => series.metal === raw.metal && series.purity === String(raw.purity) && series.unit === raw.unit,
  );
  if (!expected) return { ok: false, reason: `unexpected series ${raw.metal}/${raw.purity}/${raw.unit}` };
  if (raw.metal === "silver" && raw.unit !== "INR_PER_KG") return { ok: false, reason: "silver must be quoted per kg" };
  if (raw.metal === "gold" && raw.unit !== "INR_PER_10_GRAM") {
    return { ok: false, reason: "gold must be quoted per 10 g" };
  }
  const range = SANITY[`${raw.metal}:${raw.unit}`];
  if (range && (raw.rate < range.min || raw.rate > range.max)) {
    return { ok: false, reason: `rate ${raw.rate} is outside the plausible range for this series` };
  }
  return { ok: true };
}

/** Is the provider's timestamp usable, and recent enough to publish? */
export function validateObservationTime(
  iso: string,
  now = Date.now(),
): { ok: true } | { ok: false; reason: string } {
  const parsed = Date.parse(iso);
  if (!iso || Number.isNaN(parsed)) return { ok: false, reason: "no valid provider timestamp" };
  if (parsed > now + FUTURE_TOLERANCE_MINUTES * 60_000) {
    return { ok: false, reason: "the provider timestamp is in the future" };
  }
  const ageDays = (now - parsed) / 86_400_000;
  if (ageDays > maxAgeDays()) {
    return { ok: false, reason: `the provider timestamp is ${Math.round(ageDays)} days old` };
  }
  return { ok: true };
}

/** The last value a customer could actually see for a series, if any. */
export type PreviousValue = { rate: number; source: string; observedAt: string };

export type PlausibilityVerdict =
  | { state: "ok"; deltaPct: number }
  | { state: "flagged"; deltaPct: number; reason: string }
  | { state: "uncompared"; deltaPct: null };

/**
 * Compare a new value with the last published value for the same series. A jump
 * past the threshold is FLAGGED — held for approval, never accepted quietly.
 */
export function checkPlausibility(
  rate: number,
  previous: PreviousValue | null,
  thresholdPct = maxJumpPct(),
): PlausibilityVerdict {
  if (!previous || !Number.isFinite(previous.rate) || previous.rate <= 0) {
    return { state: "uncompared", deltaPct: null };
  }
  const deltaPct = ((rate - previous.rate) / previous.rate) * 100;
  if (Math.abs(deltaPct) > thresholdPct) {
    return {
      state: "flagged",
      deltaPct,
      reason:
        `${deltaPct > 0 ? "Up" : "Down"} ${Math.abs(deltaPct).toFixed(2)}% against the last published value ` +
        `(₹${previous.rate} · ${previous.source} · ${previous.observedAt.slice(0, 10)}), which is more than the ` +
        `${thresholdPct}% approval threshold.`,
    };
  }
  return { state: "ok", deltaPct };
}

function normaliseSession(session: RawRate["session"]): MarketSession {
  return session === "AM" || session === "PM" ? session : "unknown";
}

/** Turn a database error into something the shopkeeper can act on. */
function explainIngestError(message: string): string {
  if (/approval_status|approval_reason|delta_pct|reviewed_/i.test(message)) {
    return (
      "the rate tables have not been upgraded for provider governance — run " +
      "supabase/migrations/2026-10-15_stage-11_rate_provider_governance.sql, then retry. " +
      "Nothing was stored, so the last verified rate is still what the site shows."
    );
  }
  if (/rate_type/i.test(message)) {
    return (
      "the rate tables have not been upgraded for the automatic feed — run " +
      "supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql, then retry. " +
      "Nothing was stored, so the last verified rate is still what the site shows."
    );
  }
  return message;
}

/* -------------------------------------------------------------------------- */
/* Ingest                                                                      */
/* -------------------------------------------------------------------------- */

type Client = SupabaseClient;

/** Insert one observation per series, skipping values already recorded. */
export async function ingestAll(
  result: ProviderFetchResult,
  provider: RateProvider,
): Promise<IngestSummary> {
  const client = getSupabaseAdminClient() as unknown as Client | null;
  const empty = { inserted: 0, duplicates: 0, pending: 0, rejected: [], notes: [] };
  if (!client && !localStoreAvailable()) {
    return {
      ok: false,
      provider: provider.label,
      ...empty,
      message:
        "Supabase is not configured (or the service-role key is missing) and the local rate store is off, " +
        "so nothing was stored.",
    };
  }

  const startedAt = Date.now();
  const observedAt = result.observedAt;
  const notes = result.notes ?? [];

  // The provider's own timestamp, checked before anything is written.
  const timeVerdict = validateObservationTime(observedAt);
  if (!timeVerdict.ok) {
    return {
      ok: false,
      provider: provider.label,
      ...empty,
      notes,
      message: `${timeVerdict.reason}, so nothing was stored.`,
    };
  }

  // Currency is part of the contract: a foreign-currency quote is not our rate.
  if (result.currency !== "INR") {
    return {
      ok: false,
      provider: provider.label,
      ...empty,
      notes,
      message: `The provider did not quote in INR (got ${String(result.currency)}), so nothing was stored.`,
    };
  }

  const accepted: RawRate[] = [];
  const rejected: RejectedRate[] = [];
  const seen = new Set<string>();
  for (const raw of result.rates) {
    const verdict = validateRawRate(raw);
    if (!verdict.ok) {
      rejected.push({ raw, reason: verdict.reason });
      continue;
    }
    // The same series + session twice in one payload is one value.
    const key = `${raw.metal}:${raw.purity}:${raw.unit}:${normaliseSession(raw.session)}`;
    if (seen.has(key)) {
      rejected.push({ raw, reason: "duplicate series in the same payload" });
      continue;
    }
    seen.add(key);
    accepted.push({ ...raw, purity: String(raw.purity) });
  }

  // No database on this machine: write to the git-ignored local store instead,
  // with the same validation, dedupe and plausibility rules.
  if (!client) {
    return ingestIntoLocalStore(accepted, rejected, provider, observedAt, notes);
  }

  let inserted = 0;
  let duplicates = 0;
  let pending = 0;
  const errors: string[] = [];
  const flags: string[] = [];

  for (const raw of accepted) {
    // Dedupe: the same series, same observation time and same source is the same
    // published value arriving twice (for example a cron retry).
    const { data: existing, error: lookupError } = await client
      .from("metal_rates")
      .select("id")
      .eq("metal", raw.metal)
      .eq("purity", raw.purity)
      .eq("unit", raw.unit)
      .eq("observed_at", observedAt)
      .eq("source", provider.sourceName)
      .limit(1);

    if (lookupError) {
      errors.push(explainIngestError(lookupError.message));
      continue;
    }
    if (existing && existing.length > 0) {
      duplicates += 1;
      continue;
    }

    const classification = await classifyRate(client, raw);
    if (classification.status === "pending") {
      pending += 1;
      flags.push(`${raw.metal}/${raw.purity}: ${classification.reason}`);
    }

    const row = {
      metal: raw.metal,
      purity: raw.purity,
      unit: raw.unit,
      rate: raw.rate,
      source: provider.sourceName,
      // Audit trail: a named feed ('metalsdev'), 'external' or 'manual'.
      provider: provider.recordAs ?? provider.kind,
      // A converted spot value is never presented as a published benchmark.
      rate_type: raw.rateType ?? (provider.kind === "manual" ? "manual" : "benchmark"),
      observed_at: observedAt,
      market_session: normaliseSession(raw.session),
      gst_included: raw.gstIncluded === true,
      making_charges_included: raw.makingChargesIncluded === true,
      // Governance columns — added by the Stage 11 migration.
      approval_status: classification.status,
      approval_reason: classification.reason,
      delta_pct: classification.deltaPct,
    };

    let { error: insertError } = await client.from("metal_rates").insert(row);

    // Before the Stage 12 migration the `rate_type` column does not exist. The
    // row is still honest without it (source and provider carry the meaning),
    // so the insert is retried without that one column instead of losing today's
    // rate. The migration is reported by the admin health card.
    if (insertError && /rate_type/i.test(insertError.message)) {
      const legacyRow: Record<string, unknown> = { ...row };
      delete legacyRow.rate_type;
      const retry = await client.from("metal_rates").insert(legacyRow);
      insertError = retry.error;
    }

    if (insertError) {
      errors.push(explainIngestError(insertError.message));
      continue;
    }
    inserted += 1;
  }

  const ok = errors.length === 0 && (inserted > 0 || duplicates > 0);
  const message = [
    `${accepted.length} accepted`,
    `${inserted} stored`,
    pending ? `${pending} awaiting approval` : null,
    duplicates ? `${duplicates} already present` : null,
    rejected.length ? `${rejected.length} rejected` : null,
    errors.length ? `${errors.length} failed: ${errors.slice(0, 2).join("; ")}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  await client.from("rate_job_logs").insert({
    job: "fetch-rates",
    status: inserted > 0 || duplicates > 0 ? "success" : "error",
    message,
    rows_affected: inserted,
    duration_ms: Date.now() - startedAt,
  });

  // New values are live for the next request: a scheduled job is never on a
  // latency budget, so blocking revalidation is the correct trade here. Pending
  // rows change nothing public, so they do not trigger it.
  if (inserted - pending > 0) revalidateTag("rates", { expire: 0 });

  return { ok, provider: provider.label, inserted, duplicates, pending, rejected, notes, message };
}

/**
 * The same ingest, aimed at `.data/rates.json` when Supabase is not configured.
 * Deliberately a separate function: the database path uses SQL-side dedupe and
 * governance columns, while this one has to serialise its own writes.
 */
async function ingestIntoLocalStore(
  accepted: RawRate[],
  rejected: RejectedRate[],
  provider: RateProvider,
  observedAt: string,
  notes: string[],
): Promise<IngestSummary> {
  let inserted = 0;
  let duplicates = 0;
  let pending = 0;
  const flags: string[] = [];
  const errors: string[] = [];

  for (const raw of accepted) {
    const previous = await readLocalPreviousValue({
      metal: raw.metal,
      purity: raw.purity,
      unit: raw.unit,
    });
    const verdict = checkPlausibility(raw.rate, previous);
    const approval: "auto" | "pending" = verdict.state === "flagged" ? "pending" : "auto";
    if (verdict.state === "flagged") {
      pending += 1;
      flags.push(`${raw.metal}/${raw.purity}: ${verdict.reason}`);
    }

    const outcome = await insertLocalRate({
      id: randomUUID(),
      metal: raw.metal,
      purity: raw.purity,
      unit: raw.unit,
      rate: raw.rate,
      source: provider.sourceName,
      provider: provider.recordAs ?? provider.kind,
      rate_type: raw.rateType ?? (provider.kind === "manual" ? "manual" : "benchmark"),
      observed_at: observedAt,
      fetched_at: new Date().toISOString(),
      market_session: normaliseSession(raw.session),
      gst_included: raw.gstIncluded === true,
      making_charges_included: raw.makingChargesIncluded === true,
      approval_status: approval,
      approval_reason: verdict.state === "flagged" ? verdict.reason : null,
      delta_pct: verdict.deltaPct === null ? null : Math.round(verdict.deltaPct * 100) / 100,
    });

    if (outcome === "duplicate") {
      duplicates += 1;
    } else if (outcome === "error") {
      errors.push("the local rate file could not be written");
    } else {
      inserted += 1;
    }
  }

  const ok = errors.length === 0 && (inserted > 0 || duplicates > 0);
  const message = [
    `${accepted.length} accepted`,
    `${inserted} stored`,
    pending ? `${pending} awaiting approval` : null,
    duplicates ? `${duplicates} already present` : null,
    rejected.length ? `${rejected.length} rejected` : null,
    errors.length ? `${errors.length} failed: ${errors.slice(0, 2).join("; ")}` : null,
    // Says plainly where it went, so nobody mistakes a local file for the shop's
    // production database.
    "(local rate store — Supabase is not configured)",
  ]
    .filter(Boolean)
    .join(", ");

  await appendLocalJobLog(inserted > 0 || duplicates > 0 ? "success" : "error", message, inserted);

  if (inserted - pending > 0) revalidateTag("rates", { expire: 0 });

  return { ok, provider: provider.label, inserted, duplicates, pending, rejected, notes, message };
}

/**
 * Whether a value can be published automatically, or must wait for a human.
 *
 * Exported because the admin's manual-entry action uses the SAME rule: a typo
 * typed by hand is exactly as capable of showing a customer a wrong number as a
 * bad payload from a provider.
 */
export async function classifyRate(
  client: Client,
  raw: RawRate,
): Promise<{ status: "auto" | "pending"; reason: string | null; deltaPct: number | null }> {
  const previous = await previousPublishedValue(client, raw);
  const verdict = checkPlausibility(raw.rate, previous);
  if (verdict.state === "flagged") {
    return { status: "pending", reason: verdict.reason, deltaPct: round2(verdict.deltaPct) };
  }
  return { status: "auto", reason: null, deltaPct: round2(verdict.deltaPct) };
}

function round2(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100) / 100;
}

/** The newest value for a series that the public site is allowed to show. */
export async function previousPublishedValue(client: Client, raw: RawRate): Promise<PreviousValue | null> {
  const { data, error } = await client
    .from("metal_rates")
    .select("rate, source, observed_at")
    .eq("metal", raw.metal)
    .eq("purity", raw.purity)
    .eq("unit", raw.unit)
    .in("approval_status", ["auto", "approved"])
    .order("observed_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  const row = data[0] as { rate: number | string; source: string | null; observed_at: string };
  const rate = typeof row.rate === "number" ? row.rate : Number(row.rate);
  if (!Number.isFinite(rate)) return null;
  return { rate, source: row.source ?? "unspecified", observedAt: row.observed_at };
}

/**
 * Record one manually read benchmark (the admin panel uses this). Same
 * validation as the automatic path, so a typo cannot become a published rate.
 */
export async function recordManualRate(input: {
  metal: "gold" | "silver";
  purity: string;
  unit: RateObservation["unit"];
  rate: number;
  observedAt: string;
  session: MarketSession;
  gstIncluded: boolean;
  makingChargesIncluded: boolean;
  sourceNote?: string;
}): Promise<IngestSummary> {
  const provider: RateProvider = {
    kind: "manual",
    sourceName: input.sourceNote?.trim() || "Entered by Tulsi Jewellers",
    label: "Manual entry",
    note: "",
    publication: "manual",
    refreshMinutes: null,
    isConfigured: () => true,
    fetchLatest: async () => ({ observedAt: input.observedAt, currency: "INR", rates: [], notes: [] }),
  };
  return ingestAll(
    {
      observedAt: input.observedAt,
      currency: "INR",
      notes: [],
      rates: [
        {
          metal: input.metal,
          purity: input.purity,
          unit: input.unit,
          rate: input.rate,
          session: input.session,
          rateType: "manual",
          gstIncluded: input.gstIncluded,
          makingChargesIncluded: input.makingChargesIncluded,
        },
      ],
    },
    provider,
  );
}
