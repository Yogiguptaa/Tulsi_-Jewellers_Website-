/**
 * GET /api/health — a small, public-safe summary of the site's subsystems.
 *
 * It answers three questions a jeweller's site actually has: are today's rates
 * there, is the site able to store anything, and are there festival dates ahead.
 * No credentials, no stack traces, no provider URLs — only states a browser could
 * print. `down` (HTTP 503) means the rate board has no value at all, which is the
 * one condition worth waking someone for; a missing database is `degraded`, not an
 * outage, because the site still serves every page.
 */

import { NextResponse } from "next/server";
import { getRatesSnapshot } from "@/lib/rates/service";
import { toApiPayload } from "@/lib/rates/api-payload";
import { inspectEnv, isCronConfigured, isDatabaseConfigured } from "@/lib/env";
import { MEDIA_ASSETS } from "@/lib/catalogue/images";
import { getNextFestivalGap } from "@/lib/festivals/service";

// No segment config: with Cache Components enabled this handler is dynamic by
// default, which is what a freshness check should be.
type State = "ok" | "degraded" | "unavailable" | "not_configured";

export async function GET() {
  const snapshot = await getRatesSnapshot();
  const rates = toApiPayload(snapshot);

  const filled = rates.lines.filter((line) => line.rate !== null).length;
  const ratesState: State =
    filled === 0 ? "unavailable" : filled < rates.lines.length ? "degraded" : "ok";

  const ageHours = rates.asOf ? Math.round((Date.now() - Date.parse(rates.asOf)) / 3_600_000) : null;
  const nextFestivalDays = await getNextFestivalGap();
  const env = inspectEnv();

  const checks = {
    rates: {
      state: ratesState,
      /** Null when nothing has ever been published. */
      ageHours: Number.isFinite(ageHours) ? ageHours : null,
      lines: rates.lines.length,
      filled,
    },
    database: isDatabaseConfigured() ? "ok" : ("not_configured" as const),
    scheduledJob: isCronConfigured() ? "ok" : ("not_configured" as const),
    festivals:
      nextFestivalDays === null ? 400 : nextFestivalDays <= 120 ? "ok" : ("dates_expiring" as const),
    media: MEDIA_ASSETS.length > 0 ? "ok" : ("missing" as const),
    config: env.ok ? "ok" : "warning",
  } as const;

  const status: "ok" | "degraded" | "down" =
    ratesState === "unavailable" ? "down" : env.ok && ratesState === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      checks: {
        ...checks,
        configWarnings: env.problems.length,
        nextFestivalDays,
      },
    },
    {
      status: status === "down" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
