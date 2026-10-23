/**
 * rates/usage.ts — monthly API-call accounting for the automatic feed.
 *
 * The free Metals.Dev plan allows 100 requests a month. A daily run spends ~30,
 * but a retry storm or a manual "Run now" must never be able to exhaust the
 * quota silently, so every call is reserved here BEFORE it is made and the job
 * stops at 90% of `RATE_API_MONTHLY_LIMIT`.
 *
 * The table (`rate_api_usage`) is created by
 * supabase/migrations/2026-10-17_stage-12_metalsdev_daily_rates.sql. If it has
 * not been run yet the feed still works — the accounting is reported as
 * unavailable rather than blocking the daily rate the shop needs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { localHasRecent, localHasToday, readLocalUsage, reserveLocalCall } from "./localStore";

export const DEFAULT_MONTHLY_LIMIT = 100;
/** Stop before the last 10% is spent, so a retry can never hit the hard cap. */
export const USAGE_STOP_RATIO = 0.9;

export type UsageSnapshot = {
  month: string;
  calls: number;
  limit: number;
  /** True once the job must not call the provider again this month. */
  blocked: boolean;
  /** False when the usage table does not exist yet. */
  tracked: boolean;
};

export function monthlyLimit(): number {
  const raw = process.env.RATE_API_MONTHLY_LIMIT;
  const value = Number(raw);
  if (!raw?.trim() || !Number.isFinite(value) || value < 1) return DEFAULT_MONTHLY_LIMIT;
  return Math.floor(value);
}

/** `YYYY-MM` in the showroom's time zone, so the reset matches the invoice month. */
export function istMonth(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(now));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}`;
}

/** Start of today in IST, as an ISO instant. India has no daylight saving. */
export function startOfIstDay(now = Date.now()): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  return new Date(`${day}T00:00:00+05:30`).toISOString();
}

type Client = SupabaseClient;

function snapshot(month: string, calls: number, limit: number, tracked = true): UsageSnapshot {
  return {
    month,
    calls,
    limit,
    blocked: calls >= Math.floor(limit * USAGE_STOP_RATIO),
    tracked,
  };
}

/** Read the current month's usage without changing it. */
export async function readUsage(client: Client | null, provider: string): Promise<UsageSnapshot | null> {
  const month = istMonth();
  if (!client) {
    const local = await readLocalUsage(provider);
    return snapshot(month, local.calls, monthlyLimit());
  }
  const limit = monthlyLimit();
  const { data, error } = await client
    .from("rate_api_usage")
    .select("calls")
    .eq("provider", provider)
    .eq("month", month)
    .maybeSingle();
  // A missing table (migration not run) is not an error the customer should see.
  if (error) return snapshot(month, 0, limit, false);
  return snapshot(month, Number(data?.calls ?? 0), limit);
}

/**
 * Reserve one call. Returns `ok: false` when the month's safe allowance is
 * spent; the caller must then leave the last verified rate in place.
 */
export async function reserveCall(
  client: Client | null,
  provider: string,
): Promise<{ ok: true; usage: UsageSnapshot | null } | { ok: false; reason: string; usage: UsageSnapshot | null }> {
  const month = istMonth();
  const limit = monthlyLimit();

  if (!client) {
    const before = await readLocalUsage(provider);
    const current = snapshot(month, before.calls, limit);
    if (current.blocked) {
      return {
        ok: false,
        usage: current,
        reason:
          `The monthly API allowance is ${Math.floor(limit * USAGE_STOP_RATIO)} of ${limit} calls ` +
          `(${before.calls} used in ${month}), so the job stopped before spending the last 10%. ` +
          "The last verified rate remains on the site. Raise RATE_API_MONTHLY_LIMIT or wait for next month.",
      };
    }
    const after = await reserveLocalCall(provider);
    return { ok: true, usage: snapshot(month, after.calls, limit) };
  }

  const { data, error } = await client
    .from("rate_api_usage")
    .select("id, calls")
    .eq("provider", provider)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    // Unknown table/column: keep the daily feed working, report untracked.
    return { ok: true, usage: snapshot(month, 0, limit, false) };
  }

  const calls = Number(data?.calls ?? 0);
  const current = snapshot(month, calls, limit);
  if (current.blocked) {
    return {
      ok: false,
      usage: current,
      reason:
        `The monthly API allowance is ${Math.floor(limit * USAGE_STOP_RATIO)} of ${limit} calls ` +
        `(${calls} used in ${month}), so the job stopped before spending the last 10%. ` +
        "The last verified rate remains on the site. Raise RATE_API_MONTHLY_LIMIT or wait for next month.",
    };
  }

  const next = calls + 1;
  if (data?.id) {
    const { error: updateError } = await client
      .from("rate_api_usage")
      .update({ calls: next, last_call_at: new Date().toISOString(), monthly_limit: limit })
      .eq("id", data.id)
      .eq("calls", calls);
    if (updateError) return { ok: true, usage: snapshot(month, calls, limit, false) };
  } else {
    const { error: insertError } = await client.from("rate_api_usage").insert({
      provider,
      month,
      calls: next,
      monthly_limit: limit,
      last_call_at: new Date().toISOString(),
    });
    if (insertError) return { ok: true, usage: snapshot(month, 0, limit, false) };
  }

  return { ok: true, usage: snapshot(month, next, limit) };
}

/**
 * Is the newest stored value from this provider younger than `hours`? Used by
 * the lazy refresh on a page view and by "Run now", so neither spends a call on
 * a number that is already current.
 */
export async function hasRecentRates(
  client: Client | null,
  provider: string,
  hours: number,
): Promise<boolean> {
  if (!client) return localHasRecent(provider, hours);
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data, error } = await client
    .from("metal_rates")
    .select("id")
    .eq("provider", provider)
    .in("approval_status", ["auto", "approved"])
    .gte("observed_at", since)
    .limit(1);
  // A missing approval_status column (migration not run) must not block the feed.
  if (error) return false;
  return (data ?? []).length > 0;
}

/** Does a publishable row from this provider already exist for today (IST)? */
export async function hasTodaysRates(client: Client | null, provider: string): Promise<boolean> {
  if (!client) return localHasToday(provider);
  const { data, error } = await client
    .from("metal_rates")
    .select("id")
    .eq("provider", provider)
    .gte("observed_at", startOfIstDay())
    .limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}
