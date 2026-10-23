/**
 * rates/providers/spot.ts — the no-signup automatic feed.
 *
 * WHY THIS EXISTS
 * ───────────────
 * MetalCharts is the preferred feed, but it needs a key. A shop that has not
 * created one yet would otherwise show nothing at all, every day. This provider
 * reads a free, key-less international spot quote so the site can publish real
 * rupee rates from day one. It is never used when a MetalCharts key is present.
 *
 * SOURCE (verified 2026-10-20)
 *   GET https://api.gold-api.com/price/XAU
 *   GET https://api.gold-api.com/price/XAG
 *   { "name": "Gold", "price": 4150.5, "currency": "USD",
 *     "updatedAt": "2026-10-20T14:34:08Z", "symbol": "XAU" }
 *
 * Prices are USD per troy ounce. They are converted with the documented daily
 * USD→INR reference rate (`fx.ts`) and then to the Indian purities:
 *   INR per gram = USD/toz × USD→INR ÷ 31.1034768
 *   24K/999 → ×10 g   22K/916 → ×916/999   20K/833 → ×833/999
 *   18K/750 → ×750/999   14K/585 → ×585/999    silver 999 → per kg (×1000)
 *
 * WHERE THE INDIAN MARKET COMES IN
 * ────────────────────────────────
 * A converted international spot price is NOT the rate an Indian jeweller
 * quotes: duty, local premium and taxes sit on top. Rather than invent that
 * difference, the showroom states it once with `RATE_INDIAN_MARKET_PCT`
 * (default 0). When it is set, the percentage is applied to every value, stored
 * in the row's notes, and printed to customers as an adjustment set by the shop
 * — never applied silently.
 *
 * Every row is stored with rate_type='spot_converted', GST and making charges
 * excluded, and is never described as the IBJA benchmark or as "Live".
 */

import { inrPerGram, type ProviderFetchResult, type RateMapper, type RawRate } from "../mappers/types";
import { fetchJsonWithRetry, usdToInr } from "../fx";
import type { RateProvider } from "../providers";

export const SPOT_GOLD_ENDPOINT = "https://api.gold-api.com/price/XAU";
export const SPOT_SILVER_ENDPOINT = "https://api.gold-api.com/price/XAG";

/** Wording shown beside converted spot values, as required by the brief. */
export const SPOT_NOTE =
  "International market price converted to INR. Indian market rates can differ due to duty, " +
  "taxes and local premiums. Please confirm today's rate at the store.";

const PURE_FINENESS = 999;
const GOLD_PURITIES: ReadonlyArray<{ fineness: number; purity: string }> = [
  { fineness: 999, purity: "999" },
  { fineness: 916, purity: "916" },
  { fineness: 833, purity: "833" },
  { fineness: 750, purity: "750" },
  { fineness: 585, purity: "585" },
];

/**
 * The showroom's stated gap between the converted international price and what
 * it actually quotes. 0 means "no adjustment", which is the honest default.
 */
export function indianMarketAdjustmentPct(): number {
  const raw = process.env.RATE_INDIAN_MARKET_PCT;
  if (raw === undefined || raw.trim() === "") return 0;
  const value = Number(raw);
  // A typo must never move every price by an arbitrary amount.
  if (!Number.isFinite(value) || value < 0 || value > 30) return 0;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function quote(payload: unknown, metal: string): { usd: number | null; at: string | null } {
  const body = asRecord(payload, `The ${metal} quote was not a JSON object.`);
  const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "";
  if (currency && currency !== "USD") {
    throw new Error(`The ${metal} quote came back in ${currency}, not USD, so nothing was stored.`);
  }
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`The ${metal} quote contained no usable price.`);
  }
  const at = typeof body.updatedAt === "string" ? body.updatedAt : null;
  return { usd: price, at };
}

function mapQuotes(
  goldPayload: unknown,
  silverPayload: unknown,
  fx: { rate: number; source: string },
): ProviderFetchResult {
  const gold = quote(goldPayload, "gold");
  const silver = quote(silverPayload, "silver");

  const times = [gold.at, silver.at].filter(
    (value): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value)),
  );
  if (times.length === 0) {
    throw new Error(
      "The provider did not send a usable timestamp, so the observation time is unknown and nothing was stored.",
    );
  }
  // The older of the two, so the card never claims to be fresher than its oldest value.
  const observedAt = times.sort()[0];

  const adjustPct = indianMarketAdjustmentPct();
  const factor = 1 + adjustPct / 100;

  const rates: RawRate[] = [];
  const notes = [
    `Converted from USD per troy ounce using ${fx.source} (USD→INR ${fx.rate}). ` +
      "Converted spot price — not the IBJA benchmark.",
  ];
  if (adjustPct > 0) {
    notes.push(
      `A local market adjustment of ${adjustPct}% (RATE_INDIAN_MARKET_PCT) was applied by the showroom.`,
    );
  }

  const goldUsd = gold.usd ?? 0;
  if (goldUsd > 0) {
    const perGram = inrPerGram(goldUsd * fx.rate, "toz");
    if (perGram === null) throw new Error("The provider's unit could not be converted.");
    for (const { fineness, purity } of GOLD_PURITIES) {
      rates.push({
        metal: "gold",
        purity,
        unit: "INR_PER_10_GRAM",
        rate: round2((perGram * factor * fineness * 10) / PURE_FINENESS),
        rateType: "spot_converted",
        gstIncluded: false,
        makingChargesIncluded: false,
      });
    }
  }

  const silverUsd = silver.usd ?? 0;
  if (silverUsd > 0) {
    const perGram = inrPerGram(silverUsd * fx.rate, "toz");
    if (perGram === null) throw new Error("The provider's unit could not be converted.");
    rates.push({
      metal: "silver",
      purity: "999",
      unit: "INR_PER_KG",
      rate: round2(perGram * factor * 1000),
      rateType: "spot_converted",
      gstIncluded: false,
      makingChargesIncluded: false,
    });
  }

  return { observedAt, currency: "INR", rates, notes };
}

export const spotProvider: RateProvider = {
  kind: "external",
  recordAs: "spot",
  sourceName: "International spot market (converted to INR)",
  label: "Automatic spot feed — no key needed",
  note:
    "Reads a free international spot quote once a day, converts USD per troy ounce to INR with a daily " +
    "reference FX rate, and derives 24K/22K/20K/18K/14K and silver 999. These are converted spot prices, " +
    "not the IBJA benchmark; duty, taxes, making charges and local premiums are excluded unless the " +
    "showroom sets RATE_INDIAN_MARKET_PCT.",
  /** Polled daily, so the UI must say "Latest available rate", never "Live". */
  publication: "published",
  refreshMinutes: 1440,
  customerNote: SPOT_NOTE,
  isConfigured: () => true,

  async fetchLatest(): Promise<ProviderFetchResult> {
    if (typeof window !== "undefined") {
      throw new Error("A rate provider may only be called from the server.");
    }
    const [goldPayload, silverPayload] = await Promise.all([
      fetchJsonWithRetry(SPOT_GOLD_ENDPOINT, {}),
      fetchJsonWithRetry(SPOT_SILVER_ENDPOINT, {}),
    ]);
    const fx = await usdToInr();
    return mapQuotes(goldPayload, silverPayload, fx);
  },
};

/** Registered so the admin panel can name the host without printing a key. */
export const spotMapper: RateMapper = {
  id: "spot",
  sourceName: spotProvider.sourceName,
  label: spotProvider.label,
  note: spotProvider.note,
  hosts: ["api.gold-api.com"],
  publication: "published",
  refreshMinutes: 1440,
  defaultEndpoint: SPOT_GOLD_ENDPOINT,
  series: [
    { metal: "gold", purity: "999", field: "price" },
    { metal: "silver", purity: "999", field: "price" },
  ],
  assumptions: [
    "Spot prices are USD per troy ounce.",
    "INR conversion uses the daily Frankfurter reference rate unless RATE_USD_INR is set.",
    "RATE_INDIAN_MARKET_PCT (default 0) is the showroom's stated gap to the local market.",
  ],
  request: () => ({ url: SPOT_GOLD_ENDPOINT, headers: {} }),
  map: () => {
    throw new Error("The spot mapper needs both the gold and silver quote; use the spot provider instead.");
  },
};
