/**
 * rates/mappers/metals-dev.ts — the ONLY provider-specific file in the repo.
 *
 * PROVIDER: Metals.Dev (https://metals.dev) — IBJA / MCX authority feed.
 * Docs: https://metals.dev/docs (read 2026-10-15)
 *
 * ENDPOINT USED (the Indian benchmark, not a converted global spot price):
 *   GET https://api.metals.dev/v1/metal/authority
 *       ?api_key=…&authority=ibja&currency=INR&unit=g
 *
 * Real documented response (metals.dev docs, abbreviated):
 *   {
 *     "status": "success",
 *     "authority": "ibja",
 *     "currency": "USD",
 *     "unit": "default",
 *     "timestamp": "2023-07-05T07:39:01.363Z",
 *     "rates": { "ibja_gold": 2215.339 }
 *   }
 *
 * The `latest` endpoint returns the same IBJA/MCX fields under `metals` together
 * with `timestamps.metal`, and is accepted too, so an owner who already pointed
 * RATE_API_URL at /v1/latest does not have to change anything.
 *
 * WHY THE CHECKED UNIT MATTERS: the documented authority response reports
 * `"unit": "default"`, which is not a unit we can convert from. Rather than
 * assume it is grams (that is exactly how a per-troy-ounce figure becomes a
 * wrong per-10-gram rate), the mapper refuses to convert and asks the owner to
 * declare the unit with RATE_API_UNIT after seeing one real response. Run
 * `node scripts/check-rate-provider.mjs` to see what actually arrives.
 *
 * NEVER import this file into a client component: it reads the API key.
 */

import {
  inrPerGram,
  gramsPerStoredUnit,
  TROY_OUNCE_GRAMS,
  type ProviderConfig,
  type ProviderFetchResult,
  type RateMapper,
  type RawRate,
  type ReturnedUnit,
} from "./types";

/** The Indian benchmark authority. Override with RATE_API_AUTHORITY if needed. */
const DEFAULT_AUTHORITY = "ibja";

const DEFAULT_ENDPOINT = "https://api.metals.dev/v1/metal/authority";

/**
 * The series this feed can supply, and the field each one comes from.
 *
 * Only what the feed really publishes is listed: the other purities (916, 833,
 * 750, 585) are NOT derived from the 999 rate here. Deriving them would put a
 * number on the page that no source published. They stay the showroom's own
 * labelled entries until a feed genuinely quotes them.
 */
const SERIES: readonly { metal: "gold" | "silver"; purity: string; field: string }[] = [
  { metal: "gold", purity: "999", field: "ibja_gold" },
  { metal: "silver", purity: "999", field: "ibja_silver" },
];

const ASSUMPTIONS: readonly string[] = [
  "the series we read from Metals.Dev's IBJA feed are Gold 999 (24K) per 10 g and Silver 999 per kg; " +
    "confirm the fineness Metals.Dev assigns to ibja_gold / ibja_silver from the response in " +
    "scripts/check-rate-provider.mjs before the site is published.",
  "IBJA quotes bullion rates excluding GST and excluding making charges, so the stored values are " +
    "recorded as “excluded” — never as included.",
  "only the fineness the feed really publishes is stored. Other purities (916/833/750/585) remain " +
    "the showroom's own entries and keep their own source label — they are never derived from this feed.",
];

/** Providers label the same unit several ways; map the ones that matter. */
function normaliseUnit(raw: unknown): ReturnedUnit {
  if (typeof raw !== "string") return "unknown";
  const value = raw.trim().toLowerCase();
  if (value === "g" || value === "gram" || value === "grams") return "g";
  if (value === "kg" || value === "kilogram" || value === "kgs") return "kg";
  if (value === "toz" || value === "oz" || value === "troy_ounce" || value === "troyounce") return "toz";
  if (value === "10g" || value === "10 g") return "10g";
  return "unknown";
}

function readNumber(table: Record<string, unknown>, field: string): number | null {
  const value = table[field];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export const metalsDevMapper: RateMapper = {
  id: "metals-dev",
  // Printed to customers as "Source: …". Names the provider AND the authority,
  // because a Metals.Dev number is really an IBJA benchmark number.
  sourceName: "IBJA benchmark (via Metals.Dev)",
  label: "Metals.Dev — IBJA/MCX authority feed",
  note:
    "Pulls the IBJA benchmark published by Metals.Dev. IBJA publishes in the morning and " +
    "again in the afternoon on business days, so this is a published benchmark, not a live " +
    "tick, and the site never labels it “Live”.",
  hosts: ["api.metals.dev"],
  publication: "published",
  // IBJA publishes twice on business days; asking more often only spends quota.
  refreshMinutes: 720,
  defaultEndpoint: DEFAULT_ENDPOINT,
  series: SERIES,
  assumptions: ASSUMPTIONS,

  request(config: ProviderConfig) {
    const endpoint = endpointFor(config.apiUrl, DEFAULT_ENDPOINT);
    const url = new URL(endpoint);
    // Metals.Dev authenticates with api_key as a query parameter.
    url.searchParams.set("api_key", config.apiKey);
    url.searchParams.set("authority", process.env.RATE_API_AUTHORITY?.trim() || DEFAULT_AUTHORITY);
    url.searchParams.set("currency", "INR");
    // Ask for grams: we do the gram → 10 g arithmetic ourselves, so the
    // conversion is visible in this file rather than hidden in the provider.
    url.searchParams.set("unit", "g");
    return { url: url.toString(), headers: { Accept: "application/json" } };
  },

  map(payload: unknown, config: ProviderConfig): ProviderFetchResult {
    const body = asRecord(payload, "The provider response was not a JSON object.");

    if (body.status === "failure") {
      const code = body.error_code ?? "unknown";
      const message = typeof body.error_message === "string" ? body.error_message : "no message";
      throw new Error(`Metals.Dev refused the request (code ${code}): ${message}`);
    }

    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "";
    if (currency !== "INR") {
      // A foreign-currency quote is not our rate and is never converted silently.
      throw new Error(
        `The provider quoted in ${currency || "an unnamed currency"}, not INR. ` +
          "Check that RATE_API_URL requests currency=INR.",
      );
    }

    const observedAt = observationTime(body);
    const table = asRateTable(body);
    const notes: string[] = [];

    const unit = normaliseUnit(body.unit);
    const effectiveUnit: ReturnedUnit = unit === "unknown" ? config.declaredUnit : unit;
    if (unit === "unknown" && config.declaredUnit !== "unknown") {
      notes.push(
        `The provider did not state a unit, so RATE_API_UNIT=${config.declaredUnit} was used. ` +
          "Confirm this against one real response.",
      );
    }
    if (effectiveUnit === "unknown") {
      throw new Error(
        "The provider did not state the unit its values are in, so nothing could be converted " +
          "safely. Set RATE_API_UNIT to the unit the provider returns (g, kg, toz or 10g).",
      );
    }

    const rates: RawRate[] = [];
    for (const series of SERIES) {
      // A plain field, and/or the AM/PM pair IBJA publishes. Reading both means
      // the morning and afternoon benchmarks are stored as separate sessions
      // rather than one overwriting the other.
      const candidates: { field: string; session?: RawRate["session"] }[] = [
        { field: series.field },
        { field: `${series.field}_am`, session: "AM" },
        { field: `${series.field}_pm`, session: "PM" },
      ];
      for (const candidate of candidates) {
        const value = readNumber(table, candidate.field);
        if (value === null) continue;
        const perGram = inrPerGram(value, effectiveUnit);
        if (perGram === null || !(perGram > 0)) continue;
        const stored = round2(perGram * gramsPerStoredUnit(unitFor(series.metal)));
        rates.push({
          metal: series.metal,
          purity: series.purity,
          unit: unitFor(series.metal),
          rate: stored,
          session: candidate.session,
          // IBJA publishes bullion rates excluding GST and making charges. Stated
          // rather than left blank, because that is what the source means.
          gstIncluded: false,
          makingChargesIncluded: false,
        });
      }
    }

    if (rates.length === 0) {
      throw new Error(
        "The response contained none of the expected IBJA/MCX fields (" +
          `${SERIES.map((series) => series.field).join(", ")}). ` +
          `Fields actually present: ${Object.keys(table).slice(0, 12).join(", ") || "none"}.`,
      );
    }

    if (effectiveUnit !== "g") {
      const how =
        effectiveUnit === "toz"
          ? `${TROY_OUNCE_GRAMS} g per troy ounce`
          : effectiveUnit === "kg"
            ? "1000 g per kg"
            : "10 g";
      notes.push(
        `Values arrived in INR per ${effectiveUnit === "toz" ? "troy ounce" : effectiveUnit} and were ` +
          `converted to ₹ per 10 g / per kg using ${how}.`,
      );
    }

    return { observedAt, currency: "INR", rates, notes };
  },
};

function unitFor(metal: "gold" | "silver"): RawRate["unit"] {
  return metal === "gold" ? "INR_PER_10_GRAM" : "INR_PER_KG";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

/** `authority` responses put the values under `rates`, `latest` under `metals`. */
function asRateTable(body: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["rates", "metals"]) {
    const candidate = body[key];
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }
  throw new Error("The response had neither a `rates` nor a `metals` object, so no value could be read.");
}

/** The provider's own timestamp. A missing one is fatal — never use "now". */
function observationTime(body: Record<string, unknown>): string {
  const timestamps = body.timestamps;
  const fromTimestamps =
    timestamps && typeof timestamps === "object" && !Array.isArray(timestamps)
      ? (timestamps as Record<string, unknown>).metal
      : undefined;
  const raw = typeof body.timestamp === "string" ? body.timestamp : fromTimestamps;
  if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
    throw new Error(
      "The provider did not send a usable timestamp, so the observation time is unknown and " +
        "nothing was stored.",
    );
  }
  return raw;
}

/**
 * Use RATE_API_URL verbatim when it names a path (so an owner can pin the exact
 * endpoint), otherwise fall back to the mapper's documented default. The host is
 * always checked by the registry before a mapper gets here.
 */
function endpointFor(apiUrl: string, fallback: string): string {
  const trimmed = apiUrl.trim();
  if (!trimmed) return fallback;
  try {
    const url = new URL(trimmed);
    return url.pathname && url.pathname !== "/" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}
