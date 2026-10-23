/**
 * rates/mappers/types.ts — the contract a provider adapter implements.
 *
 * The rest of the rate system knows nothing about any particular provider. A
 * mapper is the ONLY place that knows one provider's URL, response shape, field
 * names and unit. Adding a second provider means adding one file here — no
 * change to validation, storage, the cron route or the UI.
 *
 * HONESTY RULES a mapper must obey
 *  • Return only values the provider actually sent. Never invent, derive or
 *    "estimate" a series the provider did not publish.
 *  • Convert units only with a printed constant (see TROY_OUNCE_GRAMS), and
 *    refuse to convert when the provider does not state its unit.
 *  • Refuse a payload whose currency is not INR rather than converting from a
 *    foreign currency silently.
 *  • Every value is returned with the purity it really represents. Where a
 *    purity is an assumption (providers rarely state it in the payload), it is
 *    declared in `assumptions` and shown to the owner in the admin panel and in
 *    `scripts/check-rate-provider.mjs` output, so it is never a silent guess.
 */

import type { RateObservation } from "../types";

/** One value as returned by an external source (before validation/storage). */
export type RawRate = {
  metal: "gold" | "silver";
  purity: string;
  unit: RateObservation["unit"];
  rate: number;
  session?: RateObservation["session"];
  /**
   * How the number was produced: a published benchmark, a converted spot price,
   * or the showroom's own reading. Stored on the row so the UI never presents a
   * derived spot value as a benchmark.
   */
  rateType?: "benchmark" | "spot_converted" | "manual";
  gstIncluded?: boolean;
  makingChargesIncluded?: boolean;
};

export type ProviderFetchResult = {
  /** When the SOURCE says the value was observed (never "now"). */
  observedAt: string;
  /** ISO 4217 code the provider quoted in. Only INR is accepted. */
  currency: "INR";
  rates: RawRate[];
  /**
   * Non-fatal notes for the owner (e.g. "unit taken from RATE_API_UNIT because
   * the provider did not state one"). Never shown to a customer.
   */
  notes: string[];
};

/** The unit a value arrived in, as interpreted from the provider's own field. */
export type ReturnedUnit = "g" | "kg" | "toz" | "10g" | "unknown";

export const TROY_OUNCE_GRAMS = 31.1034768;

/**
 * Value in INR for ONE GRAM, from whatever unit the provider used.
 * Returns null when the unit is unknown: converting by assumption is how a
 * per-ounce price ends up printed as a per-10-gram rate.
 */
export function inrPerGram(value: number, unit: ReturnedUnit): number | null {
  switch (unit) {
    case "g":
      return value;
    case "kg":
      return value / 1000;
    case "toz":
      return value / TROY_OUNCE_GRAMS;
    case "10g":
      return value / 10;
    default:
      return null;
  }
}

/** Our storage unit for a series, expressed as a multiple of one gram. */
export function gramsPerStoredUnit(unit: RateObservation["unit"]): number {
  return unit === "INR_PER_KG" ? 1000 : 10;
}

/** What a provider must tell us for a mapper to build a request. */
export type ProviderConfig = {
  /** RATE_API_KEY — never logged, never returned to a client, never printed. */
  apiKey: string;
  /** RATE_API_URL — either a full endpoint or just the base host. */
  apiUrl: string;
  /** RATE_API_PROVIDER — optional explicit mapper id, overriding host matching. */
  providerId: string;
  /** RATE_API_UNIT — declared returned unit, used only when the response omits it. */
  declaredUnit: ReturnedUnit;
};

export type RateMapper = {
  /** Value of RATE_API_PROVIDER / matched from RATE_API_URL, e.g. "metals-dev". */
  id: string;
  /** Written to `metal_rates.source` and printed as "Source: …" to customers. */
  sourceName: string;
  /** Shown in the admin provider card. */
  label: string;
  /** One sentence for the admin card: what this feed is and how fresh it is. */
  note: string;
  /** Hosts this mapper is responsible for; picks the mapper from RATE_API_URL. */
  hosts: readonly string[];
  /**
   * "published" — the source publishes at set times (a benchmark). The UI may
   *   only ever say "Latest published rate".
   * "intraday" — the source genuinely updates through the trading day, so a
   *   recent value may be labelled "Live".
   */
  publication: "published" | "intraday";
  /** How often the source changes. Documents the cron schedule; not a promise. */
  refreshMinutes: number;
  /** Used when RATE_API_URL names only the host. */
  defaultEndpoint: string;
  /** Series this mapper can supply, and the assumption behind each one. */
  series: readonly { metal: "gold" | "silver"; purity: string; field: string }[];
  /** Human-readable assumptions the owner must confirm before going live. */
  assumptions: readonly string[];
  /** Request the scheduled job makes. server-only: never called from a browser. */
  request(config: ProviderConfig): { url: string; headers: Record<string, string> };
  /** Turn a provider payload into rates, or throw with a precise reason. */
  map(payload: unknown, config: ProviderConfig): ProviderFetchResult;
};
