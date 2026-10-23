/**
 * GET|POST /api/cron/fetch-rates — the automatic daily rate update.
 *
 * AUTHENTICATION: requires `Authorization: Bearer $CRON_SECRET` (or `?secret=`
 * for schedulers that cannot send headers). Without a configured secret the
 * endpoint returns 503 and refuses to run, so it is never an open write path.
 * Every response is status/counts/reasons only — the API key is never echoed.
 *
 * BEHAVIOUR (see src/lib/rates/run.ts)
 *  • RATE_PROVIDER=metalsdev + METALS_DEV_API_KEY fetches one Metals.Dev
 *    response and derives 24K/22K/20K/18K and silver 999 from the pure price.
 *  • Idempotent: if today's rates are already stored the provider is not called,
 *    so the second scheduled run costs nothing.
 *  • Stops at 90% of RATE_API_MONTHLY_LIMIT (the free plan allows 100/month).
 *  • Network and 5xx failures are retried three times with backoff inside the
 *    provider. 4xx (including quota) is not retried.
 *  • Validation failures store nothing; the last verified rate stays published
 *    with its own date. Every run is written to `rate_job_logs`.
 *
 * SCHEDULE
 *   vercel.json        0 4 * * *   = 09:30 IST, once a day (Vercel Hobby limit)
 *   .github/workflows  the same 04:00 UTC run plus a 05:00 UTC safety run that
 *                      exits immediately because today's rows already exist.
 *  Both schedulers may be active; the idempotency check makes that harmless.
 */

import { NextResponse } from "next/server";
import { runRateJob } from "@/lib/rates/run";

// No segment config: with Cache Components enabled this handler already runs at
// request time, which is exactly what a cron job needs.

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return (
    header === `Bearer ${secret}` || new URL(request.url).searchParams.get("secret") === secret
  );
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, skipped: true, message: "CRON_SECRET is not configured; the job refuses to run." },
      { status: 503 },
    );
  }
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }
  const summary = await runRateJob();
  return NextResponse.json(summary, { status: summary.ok ? 200 : 502 });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
