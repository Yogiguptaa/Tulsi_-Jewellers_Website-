/**
 * rates/providers/metalCharts.ts — the default automatic daily feed.
 *
 * PROVIDER: MetalCharts (https://metalcharts.org), docs read 2026-10-18:
 *   GET https://api.metalcharts.org/v1/prices
 *   Authorization: Bearer <key>
 *   {
 *     "success": true,
 *     "data": {
 *       "XAU": { "symbol": "XAU", "price": 4286.24, "timestamp": "2026-10-18T…Z", "stale": false },
 *       "XAG": { "symbol": "XAG", "price": 64.30,  "timestamp": "2026-10-18T…Z" }
 *     }
 *   }
 * Prices are USD per troy ounce. We convert with a documented daily USD→INR
 * reference rate (Frankfurter, no key) or the owner's RATE_USD_INR override:
 *   INR per gram = USD/toz × USD→INR ÷ 31.1034768
 *
 * Then the Indian purities are derived arithmetically, exactly like the other
 * spot feed:
 *   24K/999 → pure ×10g   22K/916 → ×916/999   20K/833 → ×833/999
 *   18K/750 → ×750/999   14K/585 → ×585/999    silver 999 → per kg (×1000)
 * Every row is stored with rate_type='spot_converted' and GST/making charges
 * excluded. It is never described as the IBJA benchmark and never as "Live".
 *
 * The free MetalCharts plan requires a visible attribution link wherever its
 * values are displayed; `RATE_ATTRIBUTION` in lib/config renders it.
 *
 * The key is read on the server only, never logged, never returned.
 */

import { inrPerGram, type ProviderFetchResult, type RateMapper, type RawRate } from "../mappers/types";
import { fetchJsonWithRetry, usdToInr } from "../fx";
import type { RateProvider } from "../providers";

export const METALCHARTS_HOST = "api.metalcharts.org";
export const METALCHARTS_ENDPOINT = "https://api.metalcharts.org/v1/prices";

/** Required wording beside converted spot values. */
export const METALCHARTS_NOTE =
  "Source: MetalCharts international spot price converted to INR. Indian market rates can differ " +
  "due to duty, taxes and local premiums. Please confirm today's rate at the store.";

const PURE_FINENESS = 999;
const GOLD_PURITIES: ReadonlyArray<{ fineness: number; purity: string }> = [
  { fineness: 999, purity: "999" },
  { fineness: 916, purity: "916" },
  { fineness: 833, purity: "833" },
  { fineness: 750, purity: "750" },
  { fineness: 585, purity: "585" },
];

function readKey(): string {
  return (process.env.RATE_API_KEY ?? process.env.METALCHARTS_API_KEY ?? "").trim();
}

function endpoint(): string {
  const configured = (process.env.RATE_API_URL ?? "").trim();
  if (!configured) return METALCHARTS_ENDPOINT;
  try {
    const url = new URL(configured);
    if (url.host !== METALCHARTS_HOST) return METALCHARTS_ENDPOINT;
    return url.pathname && url.pathname !== "/" ? url.toString() : METALCHARTS_ENDPOINT;
  } catch {
    return METALCHARTS_ENDPOINT;
  }
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function readNumber(record: Record<string, unknown>, field: string): number | null {
  const value = record[field];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapPayload(
  payload: unknown,
  fx: { rate: number; source: string },
): ProviderFetchResult {
  const body = asRecord(payload, "The provider response was not a JSON object.");
  if (body.success === false) {
    throw new Error("MetalCharts refused the request; nothing was stored.");
  }

  const data = asRecord(body.data, "The provider response had no `data` object.");
  const gold = asRecord(data.XAU ?? {}, "no XAU entry");
  const silver = asRecord(data.XAG ?? {}, "no XAG entry");

  const goldUsd = readNumber(gold, "price");
  const silverUsd = readNumber(silver, "price");
  if ((goldUsd === null || !(goldUsd > 0)) && (silverUsd === null || !(silverUsd > 0))) {
    throw new Error("The provider response contained neither a gold nor a silver value.");
  }

  const goldTime = typeof gold.timestamp === "string" ? gold.timestamp : null;
  const silverTime = typeof silver.timestamp === "string" ? silver.timestamp : null;
  const times = [goldTime, silverTime].filter(
    (value): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value)),
  );
  if (times.length === 0) {
    throw new Error(
      "The provider did not send a usable timestamp, so the observation time is unknown and nothing was stored.",
    );
  }
  // The older of the two, so the card never claims to be fresher than its oldest value.
  const observedAt = times.sort()[0];

  const rates: RawRate[] = [];
  const notes = [
    `Converted from USD per troy ounce using ${fx.source} (USD→INR ${fx.rate}). ` +
      "Converted spot price — not the IBJA benchmark.",
  ];

  if (goldUsd !== null && goldUsd > 0) {
    const perGram = inrPerGram(goldUsd * fx.rate, "toz");
    if (perGram === null) throw new Error("The provider's unit could not be converted.");
    for (const { fineness, purity } of GOLD_PURITIES) {
      rates.push({
        metal: "gold",
        purity,
        unit: "INR_PER_10_GRAM",
        rate: round2((perGram * fineness * 10) / PURE_FINENESS),
        rateType: "spot_converted",
        gstIncluded: false,
        makingChargesIncluded: false,
      });
    }
  }

  if (silverUsd !== null && silverUsd > 0) {
    const perGram = inrPerGram(silverUsd * fx.rate, "toz");
    if (perGram === null) throw new Error("The provider's unit could not be converted.");
    rates.push({
      metal: "silver",
      purity: "999",
      unit: "INR_PER_KG",
      rate: round2(perGram * 1000),
      rateType: "spot_converted",
      gstIncluded: false,
      makingChargesIncluded: false,
    });
  }

  return { observedAt, currency: "INR", rates, notes };
}

export const metalChartsProvider: RateProvider = {
  kind: "external",
  recordAs: "metalcharts",
  sourceName: "International spot market (converted to INR)",
  label: "MetalCharts — automatic daily spot price",
  note:
    "Fetches international spot prices once a day, converts USD per troy ounce to INR with a daily " +
    "reference FX rate, and derives 24K/22K/20K/18K/14K and silver 999. These are converted spot prices, " +
    "not the IBJA benchmark; duty, taxes, making charges and local premiums are excluded.",
  /** Polled daily, so the UI must say "Latest available rate", never "Live". */
  publication: "published",
  refreshMinutes: 1440,
  customerNote: METALCHARTS_NOTE,
  isConfigured: () => readKey().length > 0,

  async fetchLatest(): Promise<ProviderFetchResult> {
    if (typeof window !== "undefined") {
      throw new Error("A rate provider may only be called from the server.");
    }
    const key = readKey();
    if (!key) throw new Error("RATE_API_KEY is not set, so the automatic feed cannot run.");

    const payload = await fetchJsonWithRetry(endpoint(), { Authorization: `Bearer ${key}` });
    const fx = await usdToInr();
    return mapPayload(payload, fx);
  },
};

/** Exported for the admin diagnostics and the mapper registry. */
export const metalChartsMapper: RateMapper = {
  id: "metalcharts",
  sourceName: metalChartsProvider.sourceName,
  label: metalChartsProvider.label,
  note: metalChartsProvider.note,
  hosts: [METALCHARTS_HOST],
  publication: "published",
  refreshMinutes: 1440,
  defaultEndpoint: METALCHARTS_ENDPOINT,
  series: [
    { metal: "gold", purity: "999", field: "XAU.price" },
    { metal: "silver", purity: "999", field: "XAG.price" },
  ],
  assumptions: [
    "Spot prices are USD per troy ounce.",
    "INR conversion uses the daily Frankfurter reference rate unless RATE_USD_INR is set.",
  ],
  request: (config) => ({
    url: endpoint(),
    headers: { Accept: "application/json", Authorization: `Bearer ${config.apiKey}` },
  }),
  map: () => {
    throw new Error(
      "The MetalCharts mapper needs a USD→INR rate; use the metalcharts provider instead.",
    );
  },
};
