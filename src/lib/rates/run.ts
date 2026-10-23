/**
 * rates/run.ts — one rate job, called by both the cron route and "Run now".
 *
 * SERVER-ONLY. The order of operations is deliberate:
 *   1. is a feed configured at all?            → skip, never invent a value
 *   2. is today's rate already stored?         → skip, do not spend a call
 *   3. has the month's safe allowance run out?  → skip, keep the last value
 *   4. reserve the call, then fetch            → retries live in the provider
 *   5. validate and store                      → ingest.ts (same rules as manual)
 *   6. log every outcome                       → rate_job_logs
 *
 * A failure at any step leaves the previously stored rate untouched, so a
 * customer keeps seeing the last verified number with its own date.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ingestAll, type IngestSummary } from "./ingest";
import { resolveProvider } from "./providers";
import { appendLocalJobLog, localStoreAvailable } from "./localStore";
import { hasRecentRates, hasTodaysRates, readUsage, reserveCall, type UsageSnapshot } from "./usage";
import { RATE_REFRESH_AFTER_HOURS } from "@/lib/config";

/** Who asked for this run: the schedule, an admin, or a page view. */
export type RateJobTrigger = "scheduled" | "manual" | "lazy";

export type RateJobSummary = {
  ok: boolean;
  skipped: boolean;
  provider: string;
  trigger: RateJobTrigger;
  message: string;
  usage?: UsageSnapshot | null;
  ingest?: Pick<IngestSummary, "inserted" | "duplicates" | "pending" | "rejected" | "notes">;
};

async function log(
  client: SupabaseClient | null,
  status: "success" | "error" | "skipped",
  message: string,
  trigger: RateJobTrigger,
  rows = 0,
) {
  if (!client) {
    await appendLocalJobLog(status, `[${trigger}] ${message}`, rows);
    return;
  }
  try {
    await client.from("rate_job_logs").insert({
      job: "fetch-rates",
      status,
      message: `[${trigger}] ${message}`,
      rows_affected: rows,
      duration_ms: 0,
    });
  } catch {
    // Logging must never turn a successful ingest into a failure.
  }
}

export async function runRateJob(
  options: { trigger?: RateJobTrigger; minAgeHours?: number } = {},
): Promise<RateJobSummary> {
  const trigger = options.trigger ?? "scheduled";
  const minAgeHours = options.minAgeHours ?? RATE_REFRESH_AFTER_HOURS;
  const resolution = resolveProvider();
  const provider = resolution.active;

  if (provider.kind === "manual" || !provider.isConfigured()) {
    return {
      ok: true,
      skipped: true,
      provider: provider.label,
      trigger,
      message:
        (resolution.problem ? `${resolution.problem} ` : "") +
        "No automatic rate feed is running. Record today's published benchmark in the admin panel, " +
        "or set RATE_PROVIDER=metalcharts with RATE_API_KEY to fetch it automatically.",
    };
  }

  // Supabase is the production store. Without it, the file-backed local store
  // keeps a laptop usable; if that is also disabled, nothing is written.
  const client = getSupabaseAdminClient() as unknown as SupabaseClient | null;
  if (!client && !localStoreAvailable()) {
    return {
      ok: false,
      skipped: true,
      provider: provider.label,
      trigger,
      message:
        "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / " +
        "SUPABASE_SERVICE_ROLE_KEY are missing) and the local rate store is off, so the job cannot " +
        "store anything. The last verified rate, if any, is still what the site shows.",
    };
  }

  const providerId = provider.recordAs ?? provider.kind;
  const usageBefore = await readUsage(client, providerId);

  // 2. Idempotency. The schedule runs once a day; a lazy refresh or "Run now"
  //    only spends a call when the stored value is older than minAgeHours.
  const alreadyCurrent =
    trigger === "scheduled"
      ? await hasTodaysRates(client, providerId)
      : await hasRecentRates(client, providerId, minAgeHours);
  if (alreadyCurrent) {
    const message =
      trigger === "scheduled"
        ? "Today's rates are already stored, so the provider was not called."
        : `The stored rate is younger than ${minAgeHours} h, so the provider was not called.`;
    await log(client, "skipped", message, trigger);
    return { ok: true, skipped: true, provider: provider.label, trigger, message, usage: usageBefore };
  }

  // 3. Never spend the last 10% of the monthly allowance.
  const reserved = await reserveCall(client, providerId);
  if (!reserved.ok) {
    await log(client, "skipped", reserved.reason, trigger);
    return {
      ok: true,
      skipped: true,
      provider: provider.label,
      trigger,
      message: reserved.reason,
      usage: reserved.usage,
    };
  }

  try {
    // 4/5. The provider retries network and 5xx failures three times; ingest
    // refuses anything that is not INR, positive, timestamped and plausible.
    const result = await provider.fetchLatest();
    const summary = await ingestAll(result, provider);
    return {
      ok: summary.ok,
      skipped: false,
      provider: provider.label,
      trigger,
      message: summary.message,
      usage: reserved.usage,
      ingest: {
        inserted: summary.inserted,
        duplicates: summary.duplicates,
        pending: summary.pending,
        rejected: summary.rejected,
        notes: summary.notes,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    await log(client, "error", message, trigger);
    return { ok: false, skipped: false, provider: provider.label, trigger, message, usage: reserved.usage };
  }
}
