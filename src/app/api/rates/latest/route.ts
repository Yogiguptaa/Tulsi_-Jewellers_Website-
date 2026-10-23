/**
 * GET /api/rates/latest
 *
 * The single read path for the homepage ticker. It reads the same stored rows as
 * the rates page, so it can never show a different number, and it is uncached so
 * a freshly stored value appears immediately. When nothing is stored it says so
 * — it never returns 0.
 *
 * LAZY REFRESH: if there is no value at all, or the newest one is older than
 * RATE_REFRESH_AFTER_HOURS, this request asks the rate job for one refresh. The
 * job itself checks the configured provider, takes a short DB lock, refuses to
 * spend the last 10% of the monthly quota and skips when the stored value is
 * already fresh. A failed refresh still returns the last verified rate.
 */

import { NextResponse } from "next/server";
import { RATE_REFRESH_AFTER_HOURS } from "@/lib/config";
import { toApiPayload } from "@/lib/rates/api-payload";
import { refreshRatesIfStale } from "@/lib/rates/lazy";
import { readRatesSnapshotNow } from "@/lib/rates/service";

/** At most one refresh attempt a minute, however many tabs are open. */
const ATTEMPT_COOLDOWN_MS = 60_000;
let lastAttempt = 0;

async function snapshotWithRefresh() {
  let snapshot = await readRatesSnapshotNow();
  const ageHours = snapshot.asOf
    ? (Date.now() - Date.parse(snapshot.asOf)) / 3_600_000
    : Number.POSITIVE_INFINITY;

  if (ageHours > RATE_REFRESH_AFTER_HOURS && Date.now() - lastAttempt > ATTEMPT_COOLDOWN_MS) {
    lastAttempt = Date.now();
    const result = await refreshRatesIfStale();
    if (result.stored) snapshot = await readRatesSnapshotNow();
  }

  return snapshot;
}

export async function GET() {
  const snapshot = await snapshotWithRefresh();

  return NextResponse.json(toApiPayload(snapshot), {
    headers: {
      // Public information, but never served stale to the widget.
      "Cache-Control": "no-store",
    },
  });
}
