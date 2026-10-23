/**
 * rates/diagnostics.ts — SERVER-ONLY: the last few stored rows, whatever store
 * is active. Used by the dev tools so the owner can see real numbers, their
 * timestamps and their source without opening a database console.
 */

import { publicSupabase } from "@/lib/supabase/public";
import { localStoreAvailable, readLocalRows } from "./localStore";

export type DiagnosticRateRow = {
  metal: string;
  purity: string;
  unit: string;
  rate: number;
  /** Same value expressed for one gram, so a unit mistake is obvious. */
  perGram: number;
  source: string;
  provider: string;
  observedAt: string;
  fetchedAt: string;
};

function shape(row: {
  metal: string;
  purity: string;
  unit: string;
  rate: number | string;
  source: string | null;
  provider?: string | null;
  rate_type?: string | null;
  observed_at: string;
  fetched_at?: string | null;
}): DiagnosticRateRow {
  const rate = typeof row.rate === "number" ? row.rate : Number(row.rate);
  return {
    metal: row.metal,
    purity: row.purity,
    unit: row.unit,
    rate,
    perGram: Math.round(((row.unit === "INR_PER_KG" ? rate / 1000 : rate / 10) + Number.EPSILON) * 100) / 100,
    source: row.source ?? "unspecified",
    provider: row.provider ?? row.rate_type ?? "unknown",
    observedAt: row.observed_at,
    fetchedAt: row.fetched_at ?? row.observed_at,
  };
}

export async function readRateRowsForDiagnostics(limit = 12): Promise<DiagnosticRateRow[]> {
  const supabase = publicSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("metal_rates")
      .select("metal, purity, unit, rate, source, provider, rate_type, observed_at, fetched_at")
      .order("observed_at", { ascending: false })
      .limit(limit);
    if (!error && data) {
      return (data as unknown as Parameters<typeof shape>[0][]).map(shape);
    }
  }

  if (!localStoreAvailable()) return [];
  const rows = await readLocalRows(limit);
  return rows.map(shape);
}
