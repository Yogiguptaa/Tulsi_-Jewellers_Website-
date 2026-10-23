/**
 * rates/providers/metalsDev.ts — the automatic daily spot-price feed.
 *
 * PROVIDER: Metals.Dev (https://metals.dev) — international spot prices, quoted
 * in INR. Docs read 2026-10-17:
 *   GET https://api.metals.dev/v1/latest?api_key=…&currency=INR&unit=g
 *   {
 *     "status": "success",
 *     "currency": "INR",
 *     "unit": "g",
 *     "metals": { "gold": 8012.4, "silver": 132.1 },
 *     "currencies": { … },
 *     "timestamps": { "metal": "2026-10-17T03:59:00.000Z", "currency": "…" }
 *   }
 *
 * ONE REQUEST returns every metal. The job makes exactly one call per run, then
 * derives the Indian retail purities arithmetically:
 *   24K / 999 → the pure-gold price itself
 *   22K / 916 → pure × 916/999
 *   20K / 833 → pure × 833/999
 *   18K / 750 → pure × 750/999
 *   14K / 585 → pure × 585/999
 *   silver 999 → per kg (× 1000)
 * Every derived row is stored with `rate_type = 'spot_converted'`, so the site
 * can say plainly that these are converted international spot prices — never
 * that they are the IBJA benchmark.
 *
 * HONESTY RULES
 *  • Never called from a browser: the key is read on the server only.
 *  • GST and making charges are excluded and recorded as such.
 *  • A payload with no usable timestamp, a non-INR currency, an unknown unit or
 *    a non-positive number is refused, and the previously stored rate survives.
 *  • "Live" is never claimed: the feed is polled once a day, so the UI says
 *    "Latest available rate".
 */

import { inrPerGram, type ProviderConfig, type ProviderFetchResult, type RateMapper, type RawRate } from "../mappers/types";
import type { RateProvider } from "../providers";

export const METALS_DEV_HOST = "api.metals.dev";
export const METALS_DEV_ENDPOINT = "https://api.metals.dev/v1/latest";

/**
 * The exact sentence printed next to every converted spot value. Required
 * wording — do not shorten it in the UI.
 */
export const SPOT_CONVERTED_NOTE =
  "Source: metals.dev international spot price converted to INR. Indian market rates can differ " +
  "due to duty, taxes and local premiums. Please confirm today's rate at the store.";

/** Fineness → label. Only these five gold purities are derived from spot. */
const GOLD_PURITIES: ReadonlyArray<{ fineness: number; purity: string }> = [
  { fineness: 999, purity: "999" },
  { fineness: 916, purity: "916" },
  { fineness: 833, purity: "833" },
  { fineness: 750, purity: "750" },
  { fineness: 585, purity: "585" },
];

const PURE_FINENESS = 999;

function readKey(): string {
  // METALS_DEV_API_KEY is the documented name for this feed; RATE_API_KEY is
  // accepted for backwards compatibility with the earlier mapper setup.
  return (process.env.METALS_DEV_API_KEY ?? process.env.RATE_API_KEY ?? "").trim();
}

function endpoint(): string {
  const configured = (process.env.RATE_API_URL ?? "").trim();
  if (!configured) return METALS_DEV_ENDPOINT;
  try {
    const url = new URL(configured);
    if (url.host !== METALS_DEV_HOST) return METALS_DEV_ENDPOINT;
    // A host-only value gets the documented path; a full path is respected.
    return url.pathname && url.pathname !== "/" ? url.toString() : METALS_DEV_ENDPOINT;
  } catch {
    return METALS_DEV_ENDPOINT;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Numeric value from the payload, or null. Strings are parsed, never guessed. */
function readNumber(table: Record<string, unknown>, field: string): number | null {
  const value = table[field];
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

/** Returns the raw payload, retrying only network failures and 5xx responses. */
async function fetchWithRetries(url: string): Promise<unknown> {
  const attempts = 3;
  let lastError: Error = new Error("The rate provider could not be reached.");

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        // The key travels in the query string; a redirect would hand it to
        // another host, so redirects are refused rather than followed.
        redirect: "error",
      });
    } catch {
      lastError = new Error("The rate provider could not be reached (network error).");
      if (attempt < attempts) {
        await sleep(500 * attempt * attempt);
        continue;
      }
      throw lastError;
    }

    if (response.status >= 500) {
      lastError = new Error(`The rate provider responded with HTTP ${response.status}.`);
      if (attempt < attempts) {
        await sleep(500 * attempt * attempt);
        continue;
      }
      throw lastError;
    }

    // 4xx (including 429 / quota) is a decision, not a blip: retrying spends
    // quota and cannot succeed, so it is reported immediately.
    if (!response.ok) {
      throw new Error(`The rate provider responded with HTTP ${response.status}.`);
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new Error("The rate provider returned a response that was not valid JSON.");
    }
  }

  throw lastError;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function unitOf(raw: unknown, fallback: "g" | "kg" | "toz" | "10g" | "unknown") {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim().toLowerCase();
  if (value === "g" || value === "gram" || value === "grams") return "g";
  if (value === "kg" || value === "kilogram" || value === "kgs") return "kg";
  if (value === "toz" || value === "oz" || value === "troy_ounce") return "toz";
  if (value === "10g") return "10g";
  return fallback;
}

/**
 * The provider contract. `recordAs` is written to `metal_rates.provider`, so
 * the admin panel and the public page can tell a converted spot feed apart from
 * a hand-entered IBJA benchmark.
 */
export const metalsDevProvider: RateProvider = {
  kind: "external",
  recordAs: "metalsdev",
  sourceName: "International spot market (converted to INR)",
  label: "Metals.Dev — automatic daily spot price",
  note:
    "Fetches international spot prices in INR once a day and derives 24K/22K/20K/18K/14K and " +
    "silver 999 from the pure-metal price. These are converted spot prices, not the IBJA benchmark, " +
    "and they exclude GST, duty and making charges.",
  /** Polled daily, so the site never calls it "Live". */
  publication: "published",
  refreshMinutes: 1440,
  customerNote: SPOT_CONVERTED_NOTE,
  isConfigured: () => readKey().length > 0,

  async fetchLatest(): Promise<ProviderFetchResult> {
    if (typeof window !== "undefined") {
      throw new Error("A rate provider may only be called from the server.");
    }
    const key = readKey();
    if (!key) {
      throw new Error("METALS_DEV_API_KEY is not set, so the automatic feed cannot run.");
    }

    const url = new URL(endpoint());
    url.searchParams.set("api_key", key);
    url.searchParams.set("currency", "INR");
    // Ask for grams; the ×10 / ×1000 arithmetic stays visible in this file.
    url.searchParams.set("unit", "g");

    const payload = await fetchWithRetries(url.toString());
    return mapPayload(payload, {
      apiKey: key,
      apiUrl: url.toString(),
      providerId: "metalsdev",
      declaredUnit: "unknown",
    });
  },
};

function mapPayload(payload: unknown, config: ProviderConfig): ProviderFetchResult {
  const body = asRecord(payload, "The provider response was not a JSON object.");

  if (body.status === "failure") {
    const code = body.error_code ?? "unknown";
    const message = typeof body.error_message === "string" ? body.error_message : "no message";
    throw new Error(`Metals.Dev refused the request (code ${code}): ${message}`);
  }

  const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "";
  if (currency !== "INR") {
    throw new Error(
      `The provider quoted in ${currency || "an unnamed currency"}, not INR. Nothing was stored.`,
    );
  }

  const metals = asRecord(body.metals, "The provider response had no `metals` object.");
  const gold = readNumber(metals, "gold");
  const silver = readNumber(metals, "silver");
  if ((gold === null || !(gold > 0)) && (silver === null || !(silver > 0))) {
    throw new Error("The provider response contained neither a gold nor a silver value.");
  }

  const timestamps = body.timestamps;
  const fromTimestamps =
    timestamps && typeof timestamps === "object" && !Array.isArray(timestamps)
      ? (timestamps as Record<string, unknown>).metal
      : undefined;
  const observedAt = typeof body.timestamp === "string" ? body.timestamp : fromTimestamps;
  if (typeof observedAt !== "string" || Number.isNaN(Date.parse(observedAt))) {
    throw new Error(
      "The provider did not send a usable timestamp, so the observation time is unknown and " +
        "nothing was stored.",
    );
  }

  // `unit` is g because we asked for grams. If the provider ignored that, the
  // conversion below is applied explicitly — and an unknown unit is refused.
  const unit = unitOf(body.unit, config.declaredUnit);
  if (unit === "unknown") {
    throw new Error(
      "The provider did not state the unit its values are in, so nothing could be converted safely.",
    );
  }

  const rates: RawRate[] = [];
  const notes: string[] = [];

  if (gold !== null && gold > 0) {
    const perGram = inrPerGram(gold, unit);
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
    notes.push(
      `Gold arrived in INR per ${unit} and was converted to ₹ per 10 g; 22K/20K/18K are the ` +
        "pure 999 price × 916/833/750 ÷ 999. Converted spot price — not the IBJA benchmark.",
    );
  }

  if (silver !== null && silver > 0) {
    const perGram = inrPerGram(silver, unit);
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
    notes.push("Silver arrived per gram and was converted to ₹ per kg.");
  }

  return { observedAt, currency: "INR", rates, notes };
}

/**
 * Kept for the mapper registry: the older `RATE_PROVIDER=external` path could
 * still be pointed here, and the docs list one file per provider.
 */
export const metalsDevSpotMapper: RateMapper = {
  id: "metals-dev-spot",
  sourceName: metalsDevProvider.sourceName,
  label: metalsDevProvider.label,
  note: metalsDevProvider.note,
  hosts: [METALS_DEV_HOST],
  publication: "published",
  refreshMinutes: 1440,
  defaultEndpoint: METALS_DEV_ENDPOINT,
  series: [
    { metal: "gold", purity: "999", field: "gold" },
    { metal: "silver", purity: "999", field: "silver" },
  ],
  assumptions: [],
  request: (config) => {
    const url = new URL(endpoint());
    url.searchParams.set("api_key", config.apiKey);
    url.searchParams.set("currency", "INR");
    url.searchParams.set("unit", "g");
    return { url: url.toString(), headers: { Accept: "application/json" } };
  },
  map: (payload, config) => mapPayload(payload, config),
};
