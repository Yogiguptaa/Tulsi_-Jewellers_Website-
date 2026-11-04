/**
 * rates/india.ts — the Indian-market rate basis.
 *
 * Why this file exists: the site used to publish an international spot price
 * converted to rupees. That number is 15–22% below what an Indian counter
 * quotes, because spot excludes import duty, GST and the local premium. A
 * jewellery shop cannot show it as its own rate.
 *
 * The base here is ONE verified Indian figure — 24K (999) gold per 10 g — and
 * every other purity is DERIVED with the convention Indian rate sheets use:
 *   22K = 24K × 0.916, 20K = × 0.833, 18K = × 0.750, 14K = × 0.585
 * Silver 999 is a per-kg base; per-gram and 925 are derived from it.
 *
 * Rules kept in this module so they cannot drift:
 *  • Nothing is invented: a missing or invalid base produces no rows at all.
 *  • A value is never called "live" — it is a published benchmark.
 *  • A stored 24K is compared with the converted spot value; if it is more
 *    than 3% BELOW or more than 30% ABOVE that reference it is withheld for
 *    review instead of published.
 */

import type { RawRate } from "./mappers/types";

/** Printed as "Source: …" wherever a rate appears. */
export const INDIA_RATE_SOURCE = "India market benchmark (MCX)";

/** Mandatory label for the India basis (exact wording). */
export const INDIA_MARKET_NOTE =
  "India market benchmark (MCX), INR. Showroom rates may differ slightly.";

/** Shown when no verified Indian figure exists at all. */
export const INDIA_RATE_PENDING_MESSAGE =
  "Today's rate is being updated. Please call or WhatsApp us for the current rate.";

/** Shown when the last verified Indian figure is old. */
export const INDIA_RATE_STALE_NOTE =
  "This is the last verified Indian market rate. Please confirm today's rate at the store.";

/** Market convention used by Indian rate sheets. Do not "improve" these. */
export const GOLD_PURITY_FACTORS = {
  "999": 1,
  "916": 0.916,
  "833": 0.833,
  "750": 0.75,
  "585": 0.585,
} as const;

export type GoldPurity = keyof typeof GOLD_PURITY_FACTORS;

/** A base figure, exactly as the showroom entered or the feed published it. */
export type IndiaBenchmark = {
  gold24kPer10g: number | null;
  silverPerKg: number | null;
  /** When the SOURCE observed the figure — never "now". */
  observedAt: string | null;
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** 24K base → per-10-gram rows for every purity, in the order RATE_ROWS uses. */
export function deriveGoldPer10g(base24k: number): { purity: GoldPurity; rate: number }[] {
  if (!isPositiveNumber(base24k)) return [];
  return (Object.keys(GOLD_PURITY_FACTORS) as GoldPurity[]).map((purity) => ({
    purity,
    rate: round2(base24k * GOLD_PURITY_FACTORS[purity]),
  }));
}

/** 24K base per 10 g → price of one gram. */
export function goldPerGram(base24k: number): number | null {
  if (!isPositiveNumber(base24k)) return null;
  return round2(base24k / 10);
}

/** Silver 999 per kg, with the derived per-gram and 925 figures. */
export function deriveSilver(base999PerKg: number): {
  perKg: number;
  perGram: number;
  silver925PerKg: number;
  silver925PerGram: number;
} | null {
  if (!isPositiveNumber(base999PerKg)) return null;
  const silver925PerKg = round2(base999PerKg * 0.925);
  return {
    perKg: round2(base999PerKg),
    perGram: round2(base999PerKg / 1000),
    silver925PerKg,
    silver925PerGram: round2(silver925PerKg / 1000),
  };
}

/**
 * The rows a provider returns. A missing base contributes nothing — a blank
 * line beats a zero, and ₹0 is banned in customer copy for exactly this reason.
 */
export function toRawRates(benchmark: IndiaBenchmark): RawRate[] {
  const rates: RawRate[] = [];
  if (isPositiveNumber(benchmark.gold24kPer10g)) {
    for (const row of deriveGoldPer10g(benchmark.gold24kPer10g)) {
      rates.push({
        metal: "gold",
        purity: row.purity,
        unit: "INR_PER_10_GRAM",
        rate: row.rate,
        rateType: "benchmark",
      });
    }
  }
  if (isPositiveNumber(benchmark.silverPerKg)) {
    rates.push({
      metal: "silver",
      purity: "999",
      unit: "INR_PER_KG",
      rate: round2(benchmark.silverPerKg),
      rateType: "benchmark",
    });
  }
  return rates;
}

/**
 * Sanity band. These are wide on purpose: they catch a decimal-point slip or a
 * pasted foreign-currency number, not a real market move.
 */
export const INDIA_MIN_GOLD_24K = 20_000;
export const INDIA_MAX_GOLD_24K = 500_000;
export const INDIA_MIN_SILVER_KG = 20_000;
export const INDIA_MAX_SILVER_KG = 5_000_000;

/** A timestamp more than an hour in the future is a data-entry mistake. */
const FUTURE_TOLERANCE_MS = 60 * 60 * 1000;

export function validateIndiaBenchmark(
  benchmark: IndiaBenchmark,
  now: number = Date.now(),
): { ok: boolean; problems: string[] } {
  const problems: string[] = [];

  if (!isPositiveNumber(benchmark.gold24kPer10g)) {
    problems.push("24K gold per 10 g is missing or not a positive number");
  } else if (
    benchmark.gold24kPer10g < INDIA_MIN_GOLD_24K ||
    benchmark.gold24kPer10g > INDIA_MAX_GOLD_24K
  ) {
    problems.push(
      `24K gold per 10 g (${benchmark.gold24kPer10g}) is outside the plausible range`,
    );
  }

  if (!isPositiveNumber(benchmark.silverPerKg)) {
    problems.push("silver per kg is missing or not a positive number");
  } else if (
    benchmark.silverPerKg < INDIA_MIN_SILVER_KG ||
    benchmark.silverPerKg > INDIA_MAX_SILVER_KG
  ) {
    problems.push(`silver per kg (${benchmark.silverPerKg}) is outside the plausible range`);
  }

  if (!benchmark.observedAt) {
    problems.push("observedAt is missing");
  } else {
    const time = Date.parse(benchmark.observedAt);
    if (Number.isNaN(time)) {
      problems.push("observedAt is not a valid date");
    } else if (time > now + FUTURE_TOLERANCE_MS) {
      problems.push("observedAt is in the future");
    }
  }

  return { ok: problems.length === 0, problems };
}

/** How old a stored figure is, in hours; null when the timestamp is unusable. */
export function benchmarkAgeHours(
  observedAt: string | null,
  now: number = Date.now(),
): number | null {
  if (!observedAt) return null;
  const time = Date.parse(observedAt);
  if (Number.isNaN(time)) return null;
  return (now - time) / 3_600_000;
}

/** A converted spot value more than 3% below the Indian figure is suspicious. */
export const REFERENCE_FLOOR = 0.97;
/** …and more than 30% above it is just as suspicious. */
export const REFERENCE_CEILING = 1.3;

/**
 * Compare the Indian 24K figure with the spot-converted 24K figure.
 * `ok: false` means the record must be held for review, not published.
 * When no reference is available the check cannot fail a valid record.
 */
export function referenceCheck(
  india24k: number,
  spotConverted24k: number | null,
): { ok: boolean; ratio: number | null; reason: string | null } {
  if (!isPositiveNumber(spotConverted24k) || !isPositiveNumber(india24k)) {
    return { ok: true, ratio: null, reason: null };
  }
  const ratio = india24k / spotConverted24k;
  if (ratio < REFERENCE_FLOOR) {
    return {
      ok: false,
      ratio,
      reason: "Indian 24K is more than 3% below the converted international spot value",
    };
  }
  if (ratio > REFERENCE_CEILING) {
    return {
      ok: false,
      ratio,
      reason: "Indian 24K is more than 30% above the converted international spot value",
    };
  }
  return { ok: true, ratio, reason: null };
}
