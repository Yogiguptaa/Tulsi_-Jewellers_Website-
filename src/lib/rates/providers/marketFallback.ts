/**
 * rates/providers/marketFallback.ts — the second, independent key-less feed.
 *
 * WHY
 * ───
 * The primary key-less feed (api.gold-api.com) occasionally stops answering for a
 * while. When it does at 2 a.m., the board went blank: no stored row, no live
 * value, and the visitor read "Today's rate is being updated". A shop cannot show
 * an empty board because one third-party endpoint had a bad night, so this reads
 * a completely different publisher.
 *
 * SOURCE (verified 2026-11-01)
 *   GET https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=1d&interval=1d
 *   GET https://query1.finance.yahoo.com/v8/finance/chart/SI=F?range=1d&interval=1d
 *   { "chart": { "result": [ { "meta": { "regularMarketPrice": 3876.4,
 *     "regularMarketTime": 1793393999, "currency": "USD", … } } ] } }
 *
 * These are COMEX gold and silver FUTURES in USD per troy ounce — not the spot
 * price and not the IBJA benchmark. They are converted with the same documented
 * USD→INR reference rate and the same purity arithmetic, and every row says
 * "COMEX futures" on it so nobody mistakes the fallback for the primary feed.
 * The fallback is used only when the configured provider fails; it never
 * overrides a successful read.
 */

import { inrPerGram, type ProviderFetchResult, type RateMapper, type RawRate } from "../mappers/types";
import { fetchJsonWithRetry, usdToInr } from "../fx";
import type { RateProvider } from "../providers";

export const MARKET_FALLBACK_HOST = "query1.finance.yahoo.com";
const GOLD = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=1d&interval=1d";
const SILVER = "https://query1.finance.yahoo.com/v8/finance/chart/SI=F?range=1d&interval=1d";

/** A browser-like User-Agent: the endpoint refuses the default fetch agent. */
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; TulsiJewellersRateJob/1.0; +https://tulsijewellerswebsite.vercel.app)",
};

export const MARKET_FALLBACK_NOTE =
  "International market price converted to INR (COMEX gold and silver futures). Indian market " +
  "rates can differ due to duty, taxes and local premiums. Please confirm today's rate at the store.";

const PURE_FINENESS = 999;
const GOLD_PURITIES: ReadonlyArray<{ fineness: number; purity: string }> = [
  { fineness: 999, purity: "999" },
  { fineness: 916, purity: "916" },
  { fineness: 833, purity: "833" },
  { fineness: 750, purity: "750" },
  { fineness: 585, purity: "585" },
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Pull `regularMarketPrice` and a real timestamp out of a Yahoo chart payload. */
export function readChart(payload: unknown, metal: string): { usd: number; at: string } {
  const chart = (payload as { chart?: { result?: unknown[] } })?.chart;
  const first = Array.isArray(chart?.result) ? chart.result[0] : null;
  const meta = (first as { meta?: Record<string, unknown> } | null)?.meta;
  if (!meta) throw new Error(`The ${metal} fallback quote had no chart data.`);

  const price = typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : Number(meta.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`The ${metal} fallback quote contained no usable price.`);
  }
  const seconds = typeof meta.regularMarketTime === "number" ? meta.regularMarketTime : Number(meta.regularMarketTime);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`The ${metal} fallback quote had no usable timestamp.`);
  }
  return { usd: price, at: new Date(seconds * 1000).toISOString() };
}

export function mapFutures(
  gold: { usd: number; at: string },
  silver: { usd: number; at: string },
  fx: { rate: number; source: string },
): ProviderFetchResult {
  const observedAt = [gold.at, silver.at].sort()[0];
  const rates: RawRate[] = [];

  const goldPerGram = inrPerGram(gold.usd * fx.rate, "toz");
  if (goldPerGram === null) throw new Error("The fallback gold price could not be converted.");
  for (const { fineness, purity } of GOLD_PURITIES) {
    rates.push({
      metal: "gold",
      purity,
      unit: "INR_PER_10_GRAM",
      rate: round2((goldPerGram * fineness * 10) / PURE_FINENESS),
      rateType: "spot_converted",
      gstIncluded: false,
      makingChargesIncluded: false,
    });
  }

  const silverPerGram = inrPerGram(silver.usd * fx.rate, "toz");
  if (silverPerGram === null) throw new Error("The fallback silver price could not be converted.");
  rates.push({
    metal: "silver",
    purity: "999",
    unit: "INR_PER_KG",
    rate: round2(silverPerGram * 1000),
    rateType: "spot_converted",
    gstIncluded: false,
    makingChargesIncluded: false,
  });

  return {
    observedAt,
    currency: "INR",
    rates,
    notes: [
      `Converted from COMEX futures in USD per troy ounce using ${fx.source} (USD→INR ${fx.rate}).`,
      "Fallback source: used because the primary feed did not answer. Not the IBJA benchmark.",
    ],
  };
}

export const marketFallbackProvider: RateProvider = {
  kind: "external",
  recordAs: "market",
  sourceName: "COMEX futures converted to INR (fallback feed)",
  label: "Fallback feed — COMEX futures, no key needed",
  note:
    "Reads COMEX gold and silver futures, converts USD per troy ounce to INR with a daily reference " +
    "FX rate and derives 24K/22K/20K/18K/14K and silver 999. Used only when the primary feed does not " +
    "answer; never the IBJA benchmark.",
  publication: "published",
  refreshMinutes: 1440,
  customerNote: MARKET_FALLBACK_NOTE,
  isConfigured: () => true,

  async fetchLatest(): Promise<ProviderFetchResult> {
    if (typeof window !== "undefined") {
      throw new Error("A rate provider may only be called from the server.");
    }
    const [goldPayload, silverPayload] = await Promise.all([
      fetchJsonWithRetry(GOLD, HEADERS),
      fetchJsonWithRetry(SILVER, HEADERS),
    ]);
    const fx = await usdToInr();
    return mapFutures(readChart(goldPayload, "gold"), readChart(silverPayload, "silver"), fx);
  },
};

/** Registered so the admin panel can name the host without printing a key. */
export const marketFallbackMapper: RateMapper = {
  id: "market",
  sourceName: marketFallbackProvider.sourceName,
  label: marketFallbackProvider.label,
  note: marketFallbackProvider.note,
  hosts: [MARKET_FALLBACK_HOST],
  publication: "published",
  refreshMinutes: 1440,
  defaultEndpoint: GOLD,
  series: [
    { metal: "gold", purity: "999", field: "chart.result[0].meta.regularMarketPrice" },
    { metal: "silver", purity: "999", field: "chart.result[0].meta.regularMarketPrice" },
  ],
  assumptions: [
    "COMEX futures, quoted in USD per troy ounce.",
    "INR conversion uses the daily reference rate unless RATE_USD_INR is set.",
  ],
  request: () => ({ url: GOLD, headers: HEADERS }),
  map: () => {
    throw new Error("The fallback mapper needs both metals; use the provider instead.");
  },
};
