/**
 * rates/lazy.ts — SERVER-ONLY safety net for a missed scheduled run.
 *
 * The daily cron remains the normal path. But a fresh deployment, a paused
 * schedule or a Vercel Hobby project on localhost would otherwise show no rate
 * at all until someone pressed a button, so a page view of /api/rates/latest can
 * ask for one refresh when the stored value is old or missing.
 *
 * GUARDS (all must pass before a provider is called):
 *   1. an automatic feed must be configured (a key exists);
 *   2. a short DB lock must be claimed, so two simultaneous page views cannot
 *      both fetch (compare-and-swap on `rate_refresh_locks.locked_until`);
 *   3. the run itself is idempotent and stops at 90% of the monthly quota;
 *   4. it fails silently: a page view must still render the last stored rate.
 *
 * The lock table is created by the Stage 13 migration. If it has not been run,
 * lazy refresh is simply skipped — the scheduled job is unaffected.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { claimLocalLock, localStoreAvailable, releaseLocalLock } from "./localStore";
import { resolveProvider } from "./providers";
import { runRateJob } from "./run";

/** How long one holder may keep the lock. A fetch with retries is < 30 s. */
const LOCK_MINUTES = 5;

async function claimLock(client: SupabaseClient, provider: string): Promise<boolean> {
  const now = new Date();
  const until = new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString();

  const { data, error } = await client
    .from("rate_refresh_locks")
    .select("provider, locked_until")
    .eq("provider", provider)
    .maybeSingle();
  if (error) return false;

  if (!data) {
    const { error: insertError } = await client
      .from("rate_refresh_locks")
      .insert({ provider, locked_until: until, locked_at: now.toISOString() });
    return !insertError;
  }

  const heldUntil = typeof data.locked_until === "string" ? data.locked_until : "";
  if (heldUntil && Date.parse(heldUntil) > now.getTime()) return false;

  // Compare-and-swap: only the writer that still sees the old value wins.
  const { data: updated, error: updateError } = await client
    .from("rate_refresh_locks")
    .update({ locked_until: until, locked_at: now.toISOString() })
    .eq("provider", provider)
    .eq("locked_until", heldUntil)
    .select("provider");
  if (updateError) return false;
  return (updated ?? []).length === 1;
}

async function releaseLock(client: SupabaseClient, provider: string): Promise<void> {
  try {
    await client
      .from("rate_refresh_locks")
      .update({ locked_until: new Date(0).toISOString() })
      .eq("provider", provider);
  } catch {
    // The lock expires by itself; failing to release early is harmless.
  }
}

export type LazyRefreshResult = {
  attempted: boolean;
  stored: boolean;
  message: string | null;
};

/**
 * Refresh when the caller has already decided the value is stale or missing.
 * Never throws: the caller is rendering a page.
 */
export async function refreshRatesIfStale(): Promise<LazyRefreshResult> {
  const resolution = resolveProvider();
  if (resolution.active.kind === "manual" || !resolution.active.isConfigured()) {
    return { attempted: false, stored: false, message: "No automatic feed is configured." };
  }

  const client = getSupabaseAdminClient() as unknown as SupabaseClient | null;
  if (!client && !localStoreAvailable()) {
    return { attempted: false, stored: false, message: "Supabase is not configured." };
  }

  const providerId = resolution.active.recordAs ?? resolution.active.kind;
  const claimed = client
    ? await claimLock(client, providerId).catch(() => false)
    : await claimLocalLock(providerId).catch(() => false);
  if (!claimed) {
    return { attempted: false, stored: false, message: "Another refresh is already running." };
  }

  try {
    const summary = await runRateJob({ trigger: "lazy" });
    return {
      attempted: true,
      stored: summary.ok && !summary.skipped,
      message: summary.message,
    };
  } catch (error) {
    return {
      attempted: true,
      stored: false,
      message: error instanceof Error ? error.message : "Unknown refresh error",
    };
  } finally {
    if (client) await releaseLock(client, providerId);
    else await releaseLocalLock(providerId);
  }
}
