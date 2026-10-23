/**
 * GET /api/dev/rates-status — development-only rate diagnostics.
 *
 * Answers the four questions that explain a blank rate board: is a feed
 * configured, which store is in use, is there a stored row and how old is it,
 * and what did the last job say. It is a 404 in production, is readable without
 * signing in (it is a local debugging tool), and never prints a key, a URL
 * containing a key, or an environment value.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { readRateRowsForDiagnostics } from "@/lib/rates/diagnostics";
import { localStoreAvailable, localStoreFile, readLocalJobLogs } from "@/lib/rates/localStore";
import { resolveProvider } from "@/lib/rates/providers";
import { readUsage } from "@/lib/rates/usage";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const resolution = resolveProvider();
  const provider = resolution.active;
  const providerId = provider.recordAs ?? provider.kind;
  const client = getSupabaseAdminClient();
  const store = client ? "supabase" : localStoreAvailable() ? "local file" : "none";

  const report: Record<string, unknown> = {
    env: {
      // Names only, never values.
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      RATE_API_KEY: Boolean(process.env.RATE_API_KEY || process.env.METALCHARTS_API_KEY),
      METALS_DEV_API_KEY: Boolean(process.env.METALS_DEV_API_KEY),
      CRON_SECRET: Boolean(process.env.CRON_SECRET),
      RATE_PROVIDER: process.env.RATE_PROVIDER ?? "(unset → automatic)",
      RATE_INDIAN_MARKET_PCT: process.env.RATE_INDIAN_MARKET_PCT ?? "(unset → 0)",
    },
    provider: {
      requested: resolution.requested,
      active: provider.label,
      recordAs: providerId,
      configured: provider.isConfigured(),
      publication: provider.publication,
      problem: resolution.problem,
    },
    store: { kind: store, file: store === "local file" ? localStoreFile() : null },
    latest: null,
    usage: null,
    lastJob: null,
  };

  const rows = await readRateRowsForDiagnostics(12);
  const newest = rows[0]?.observedAt ?? null;
  report.latest = {
    rows,
    newest,
    ageHours: newest ? Math.round(((Date.now() - Date.parse(newest)) / 3_600_000) * 10) / 10 : null,
  };

  report.usage = await readUsage(client, providerId);
  report.lastJob = client
    ? "see rate_job_logs in Supabase"
    : await readLocalJobLogs(3);

  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
