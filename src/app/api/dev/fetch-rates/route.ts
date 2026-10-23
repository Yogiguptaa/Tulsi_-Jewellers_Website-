/**
 * GET /api/dev/fetch-rates — run the rate job once and show what was stored.
 *
 * A development tool (404 in production) for the owner and for `npm run
 * rates:fetch`. It answers "is the feed really working?" without waiting for a
 * schedule: the job skips when today's rate is already stored unless
 * `?force=1`, and every failure is printed as the exact reason.
 *
 * It never prints a key or an environment value.
 */

import { NextResponse } from "next/server";
import { resolveProvider } from "@/lib/rates/providers";
import { readRateRowsForDiagnostics } from "@/lib/rates/diagnostics";
import { runRateJob } from "@/lib/rates/run";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const force = new URL(request.url).searchParams.get("force") === "1";
  const resolution = resolveProvider();

  const summary = await runRateJob(
    force ? { trigger: "manual", minAgeHours: 0 } : { trigger: "manual" },
  );
  const rows = await readRateRowsForDiagnostics(12);

  return NextResponse.json(
    {
      provider: {
        requested: resolution.requested,
        active: resolution.active.label,
        configured: resolution.active.isConfigured(),
        problem: resolution.problem,
      },
      job: {
        ok: summary.ok,
        skipped: summary.skipped,
        message: summary.message,
        insert: summary.ingest ?? null,
        usage: summary.usage ?? null,
      },
      storedRows: rows,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
