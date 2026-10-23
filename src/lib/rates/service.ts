/**
 * rates/service.ts — SERVER-ONLY reads of the stored rates.
 *
 * Produces a `RatesSnapshot` for the rates page, the homepage ticker and the
 * history page. It never invents a value: when no observation exists the status
 * is `unavailable` and the UI says so.
 */

import { cacheLife, cacheTag } from "next/cache";
import { RATE_ROWS } from "@/lib/config";
import { publicSupabase } from "@/lib/supabase/public";
import { localStoreAvailable, readLocalRows } from "./localStore";
import { resolveProvider } from "./providers";
import { SPOT_CONVERTED_NOTE } from "./providers/metalsDev";
import { formatDateTime } from "./format";
import type { MarketSession, RateLine, RateObservation, RateSource, RateStatusKind, RatesSnapshot } from "./types";

/**
 * The automatic feed refreshes daily. Once a value is older than a day and a
 * half the page stops calling it current and asks the customer to confirm at
 * the store — it is still shown, with its own date, never hidden or faked.
 */
const STALE_AFTER_HOURS = 36;

type MetalRateRow = {
  id: string;
  metal: "gold" | "silver";
  purity: string;
  unit: RateObservation["unit"];
  rate: number | string;
  source: string | null;
  observed_at: string;
  fetched_at: string | null;
  /** Added by the Stage 2.1 migration; optional for backwards compatibility. */
  market_session?: string | null;
  gst_included?: boolean | null;
  making_charges_included?: boolean | null;
  /** 'manual', 'external' or a named feed such as 'metalsdev'. */
  provider?: string | null;
  /** 'benchmark' | 'spot_converted' | 'manual' (Stage 12). */
  rate_type?: string | null;
};

const PUBLISHED_COLUMNS =
  "id, metal, purity, unit, rate, source, observed_at, fetched_at, " +
  "market_session, gst_included, making_charges_included, provider";

/**
 * Read only the rows a visitor is allowed to see.
 *
 * `approval_status` is added by the Stage 11 migration, and only 'auto' and
 * 'approved' rows are publishable — a value flagged as an implausible jump stays
 * invisible until an admin approves it. If that column does not exist yet, the
 * ingest refuses to write at all, so no row can be pending and an unfiltered
 * read cannot leak a held-back value; the site therefore keeps working instead
 * of going dark over an unrun migration.
 */
async function readPublishedRows(
  supabase: NonNullable<ReturnType<typeof publicSupabase>>,
): Promise<{ rows: MetalRateRow[]; error: string | null }> {
  const published = await supabase
    .from("metal_rates")
    .select(PUBLISHED_COLUMNS)
    .in("approval_status", ["auto", "approved"])
    .order("observed_at", { ascending: false })
    .limit(400);

  if (!published.error) {
    return { rows: (published.data ?? []) as unknown as MetalRateRow[], error: null };
  }
  if (!/approval_status|does not exist|schema cache/i.test(published.error.message)) {
    return { rows: [], error: published.error.message };
  }

  const fallback = await supabase
    .from("metal_rates")
    .select(PUBLISHED_COLUMNS)
    .order("observed_at", { ascending: false })
    .limit(400);
  return {
    rows: (fallback.data ?? []) as unknown as MetalRateRow[],
    error: fallback.error?.message ?? null,
  };
}

function toObservation(row: MetalRateRow): RateObservation {
  const session = row.market_session === "AM" || row.market_session === "PM" ? row.market_session : "unknown";
  return {
    id: row.id,
    metal: row.metal,
    purity: row.purity,
    unit: row.unit,
    rate: typeof row.rate === "number" ? row.rate : Number(row.rate),
    source: row.source ?? "unspecified",
    session,
    // Only ever true when the source states it; otherwise assume excluded.
    gstIncluded: row.gst_included === true,
    makingChargesIncluded: row.making_charges_included === true,
    observedAt: row.observed_at,
    fetchedAt: row.fetched_at ?? row.observed_at,
  };
}

function emptySnapshot(notice: string | null): RatesSnapshot {
  return {
    status: "unavailable",
    providerLabel: "Ask the showroom for today's rate",
    isConfigured: false,
    asOf: null,
    generatedAt: new Date().toISOString(),
    lines: RATE_ROWS.map((row) => ({
      row,
      latest: null,
      previous: null,
      deltaAbs: null,
      deltaPct: null,
    })),
    sources: [],
    intraday: false,
    spotConverted: false,
    customerNote: null,
    notice,
  };
}

/**
 * Assemble today's rates from whatever is stored right now. Deliberately
 * uncached: the API route calls it after a possible lazy refresh, and the cached
 * wrapper below is what the pages use.
 */
export async function readRatesSnapshotNow(): Promise<RatesSnapshot> {
  const supabase = publicSupabase();

  if (!supabase) {
    // No database connected yet: use the git-ignored local store so a laptop
    // shows today's real rate instead of an empty board. Values, validation and
    // timestamps are identical to the database path.
    if (localStoreAvailable()) {
      const rows = await readLocalRows();
      if (rows.length > 0) return assembleSnapshot(rows as unknown as MetalRateRow[]);
    }
    return emptySnapshot(
      "Today's rate is being updated. Please call or WhatsApp us for the current rate.",
    );
  }

  try {
    const { rows, error } = await readPublishedRows(supabase);
    if (error) throw new Error(error);

    if (rows.length === 0) {
      return emptySnapshot(
        "Today's rate is being updated. Please call or WhatsApp us for the current rate.",
      );
    }

    return assembleSnapshot(rows);
  } catch {
    return emptySnapshot(
      "The rate store could not be reached just now, so no rate is displayed. Please try again shortly.",
    );
  }
}

/** Turn stored rows into the snapshot every page renders. Never invents a value. */
function assembleSnapshot(rows: MetalRateRow[]): RatesSnapshot {
  {
    // A rate the showroom typed in itself is the rate it stands behind, so a
    // fresh manual row leads its series ahead of an automatic one. Once it is
    // older than the staleness window the automatic value takes over again —
    // an old entry must never freeze the board.
    const nowMs = Date.now();
    const manualIsFresh = (observation: RateObservation & { manual: boolean }) =>
      observation.manual && nowMs - Date.parse(observation.observedAt) <= STALE_AFTER_HOURS * 3_600_000;

    const observations = rows
      .map((row) => ({ ...toObservation(row), manual: row.provider === "manual" }))
      .filter((observation) => Number.isFinite(observation.rate) && observation.rate > 0)
      .sort((a, b) => {
        const aManual = manualIsFresh(a) ? 1 : 0;
        const bManual = manualIsFresh(b) ? 1 : 0;
        if (aManual !== bManual) return bManual - aManual;
        return Date.parse(b.observedAt) - Date.parse(a.observedAt);
      });

    // Group per series, newest first. A few entries are kept per series so the
    // change can be measured against the previous DAY rather than against the
    // last fetch a few minutes ago.
    const bySeries = new Map<string, RateObservation[]>();
    for (const observation of observations) {
      const key = `${observation.metal}:${observation.purity}:${observation.unit}`;
      const list = bySeries.get(key) ?? [];
      if (list.length < 30) list.push(observation);
      bySeries.set(key, list);
    }

    const lines: RateLine[] = RATE_ROWS.map((row) => {
      const series = bySeries.get(`${row.metal}:${row.fineness}:${row.unit}`) ?? [];
      const latest = series[0] ?? null;
      // "Change" means since the last business day, which is what a customer
      // reads it as. Comparing two fetches minutes apart would show a pointless
      // ±₹30 move that is not a day's movement at all.
      const latestDay = latest ? istDay(latest.observedAt) : null;
      const previous =
        latest && latestDay
          ? (series.find((entry) => entry !== latest && istDay(entry.observedAt) < latestDay) ?? null)
          : null;
      const deltaAbs = latest && previous ? latest.rate - previous.rate : null;
      const deltaPct =
        latest && previous && previous.rate > 0 ? ((latest.rate - previous.rate) / previous.rate) * 100 : null;
      return { row: { ...row, purityLabel: row.purityLabel }, latest, previous, deltaAbs, deltaPct };
    });

    const newest = observations[0]?.observedAt ?? null;
    const ageHours = newest ? (Date.now() - Date.parse(newest)) / 3_600_000 : Number.POSITIVE_INFINITY;

    // "Live" may only be claimed by a feed that genuinely updates through the
    // day AND whose newest value is minutes old. A published benchmark (IBJA's
    // AM/PM rate, for example) is never described as live, however fresh it is.
    const provider = resolveProvider().active;
    const intraday = provider.publication === "intraday";
    // A converted spot value is never presented as an IBJA benchmark. Read from
    // the row's provider/source rather than a newer column, so the page keeps
    // working before the Stage 12 migration has been run.
    const spotConverted = rows.some(
      (row) =>
        row.rate_type === "spot_converted" ||
        row.provider === "metalsdev" ||
        row.provider === "spot" ||
        /spot/i.test(row.source ?? ""),
    );

    let status: RateStatusKind = "updated";
    if (!newest) status = "unavailable";
    else if (ageHours > STALE_AFTER_HOURS) status = "stale";
    else if (intraday && ageHours <= 0.75) status = "live";
    else if (ageHours > STALE_AFTER_HOURS - 6) status = "market_closed";

    // One entry per distinct source, newest first. Values are never merged
    // across sources, so when a board shows values from two sources it says so
    // here and labels each line as well.
    const sources: RateSource[] = [];
    const seenSources = new Set<string>();
    for (const row of rows) {
      const name = row.source ?? "unspecified";
      if (seenSources.has(name)) continue;
      seenSources.add(name);
      sources.push({
        name,
        observedAt: row.observed_at,
        isManual: !row.provider || row.provider === "manual",
      });
    }

    return {
      status,
      providerLabel:
        sources.length === 0
          ? "Tulsi Jewellers"
          : sources.slice(0, 2).map((source) => source.name).join(" • "),
      sources,
      intraday,
      spotConverted,
      customerNote: spotConverted ? (provider.customerNote ?? SPOT_CONVERTED_NOTE) : null,
      isConfigured: true,
      asOf: newest,
      generatedAt: new Date().toISOString(),
      lines,
      notice:
        status === "stale"
          ? `Showing the last verified rate from ${
              newest ? formatDateTime(newest, "en") : "an earlier date"
            }. Please confirm today's rate at the store.`
          : null,
    };
  }
}

/**
 * What every page renders. Cached for a few minutes: rates change at most a few
 * times a business day, and the homepage widget polls the uncached API route.
 */
export async function getRatesSnapshot(): Promise<RatesSnapshot> {
  "use cache";
  cacheLife("minutes");
  cacheTag("rates");
  return readRatesSnapshotNow();
}

/** Daily closing (latest per day) history for the chart and table. */
export async function getRateHistory(days: number): Promise<{
  available: boolean;
  rows: { date: string; values: Record<string, number> }[];
  series: { key: string; label: string }[];
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("rates");

  const series = [
    { key: "gold:999:INR_PER_10_GRAM", label: "Gold 999 / 24K (10 g)" },
    { key: "gold:916:INR_PER_10_GRAM", label: "Gold 916 / 22K (10 g)" },
    { key: "gold:750:INR_PER_10_GRAM", label: "Gold 750 / 18K (10 g)" },
    { key: "gold:585:INR_PER_10_GRAM", label: "Gold 585 / 14K (10 g)" },
    { key: "silver:999:INR_PER_KG", label: "Silver 999 (kg)" },
  ];

  const supabase = publicSupabase();
  const since = new Date(Date.now() - days * 24 * 3_600_000).toISOString();

  if (!supabase) {
    if (!localStoreAvailable()) return { available: false, rows: [], series };
    const local = (await readLocalRows(5000)).filter((row) => Date.parse(row.observed_at) >= Date.parse(since));
    return historyFromRows(local, series);
  }

  try {
    // Only publishable rows reach the chart, so a value held back for approval
    // can never appear on a public graph before a human has seen it.
    const columns = "metal, purity, unit, rate, observed_at";
    const filtered = await supabase
      .from("metal_rates")
      .select(columns)
      .in("approval_status", ["auto", "approved"])
      .gte("observed_at", since)
      .order("observed_at", { ascending: true })
      .limit(2000);

    let { data, error } = filtered;
    if (error && /approval_status|does not exist|schema cache/i.test(error.message)) {
      // Same tolerance as the current-rate read: without the Stage 11 migration
      // no row can be pending, so the unfiltered read leaks nothing.
      const fallback = await supabase
        .from("metal_rates")
        .select(columns)
        .gte("observed_at", since)
        .order("observed_at", { ascending: true })
        .limit(2000);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    const rows = (data ?? []) as unknown as Pick<MetalRateRow, "metal" | "purity" | "unit" | "rate" | "observed_at">[];
    return historyFromRows(rows, series);
  } catch {
    return { available: false, rows: [], series };
  }
}

/** One closing value per IST business day, for the chart. */
function historyFromRows(
  rows: ReadonlyArray<Pick<MetalRateRow, "metal" | "purity" | "unit" | "rate" | "observed_at">>,
  series: { key: string; label: string }[],
): {
  available: boolean;
  rows: { date: string; values: Record<string, number> }[];
  series: { key: string; label: string }[];
} {
  if (rows.length === 0) return { available: false, rows: [], series };

  // Oldest first, so the last observation of each day wins however the caller
  // ordered its rows (the local store keeps them newest first).
  const chronological = [...rows].sort(
    (a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at),
  );
  const byDate = new Map<string, Record<string, number>>();
  for (const row of chronological) {
    const date = istDay(row.observed_at);
    const bucket = byDate.get(date) ?? {};
    bucket[`${row.metal}:${row.purity}:${row.unit}`] =
      typeof row.rate === "number" ? row.rate : Number(row.rate);
    byDate.set(date, bucket);
  }

  return {
    available: true,
    rows: Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, values })),
    series,
  };
}

export type PublicPricingRule = {
  key: string;
  label: string;
  value: number;
  unit: string;
  note: string | null;
};

/**
 * Public pricing rules (making charges, wastage %, GST rate) that the owner has
 * marked `is_public`. The calculator uses only these — it never guesses a
 * making-charge percentage, and shows "not published" when a rule is missing.
 */
export async function getPublicPricingRules(): Promise<PublicPricingRule[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("pricing");

  const supabase = publicSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("pricing_rules")
      .select("rule_key, label_en, value, unit, notes, is_active")
      .eq("is_public", true)
      .eq("is_active", true);
    if (error) throw error;
    return ((data ?? []) as unknown as {
      rule_key: string;
      label_en: string;
      value: number | string;
      unit: string;
      notes: string | null;
    }[]).map((rule) => ({
      key: rule.rule_key,
      label: rule.label_en,
      value: typeof rule.value === "number" ? rule.value : Number(rule.value),
      unit: rule.unit,
      note: rule.notes,
    }));
  } catch {
    return [];
  }
}

export function sessionOf(observation: RateObservation | null): MarketSession {
  return observation?.session ?? "unknown";
}

/**
 * The Indian business day (Asia/Kolkata) an observation belongs to, as
 * `YYYY-MM-DD`. A rate recorded at 09:30 IST is that day's rate — bucketing by
 * the UTC date would file it under the previous day. `formatToParts` keeps the
 * output fixed regardless of the server's own time zone or locale, and the
 * `v_rate_history_daily` view in the Stage 2.1 migration uses the same rule.
 */
export function istDay(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
