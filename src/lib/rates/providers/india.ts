/**
 * rates/providers/india.ts — the Indian-market provider.
 *
 * The showroom's Indian benchmark (24K per 10 g and silver per kg) lives in
 * `content/rates/india-benchmark.json`. This file reads that one verified
 * figure, derives every other purity with the convention in `rates/india.ts`,
 * and publishes the result as a *published benchmark* — never "Live".
 *
 * Why a file and not an API: no Indian/MCX feed key is available on this
 * deployment, and a jewellery shop must not show a made-up number. One figure
 * the owner stands behind, with its own timestamp, is the honest source. Every
 * value is still checked against the converted spot price before it is shown.
 */

import benchmarkFile from "../../../../content/rates/india-benchmark.json";
import { fetchJsonWithRetry, usdToInr } from "../fx";
import {
  INDIA_MARKET_NOTE,
  INDIA_RATE_SOURCE,
  isPositiveNumber,
  referenceCheck,
  toRawRates,
  validateIndiaBenchmark,
  type IndiaBenchmark,
} from "../india";
import { inrPerGram, type ProviderFetchResult } from "../mappers/types";
import type { RateProvider } from "../providers";

const SPOT_GOLD_ENDPOINT = "https://api.gold-api.com/price/XAU";
const REFERENCE_TTL_MS = 15 * 60_000;

const file = benchmarkFile as {
  gold24kPer10g?: number | null;
  silverPerKg?: number | null;
  observedAt?: string | null;
};

/** The single verified Indian base this build publishes. */
export const INDIA_BENCHMARK: IndiaBenchmark = {
  gold24kPer10g: typeof file.gold24kPer10g === "number" ? file.gold24kPer10g : null,
  silverPerKg: typeof file.silverPerKg === "number" ? file.silverPerKg : null,
  observedAt: typeof file.observedAt === "string" ? file.observedAt : null,
};

const referenceCache = globalThis as typeof globalThis & {
  __tulsiIndiaReference?: { at: number; value: number | null };
};

/**
 * Converted spot 24K, used ONLY as a sanity reference. It is never displayed as
 * the shop's rate; it decides whether the Indian figure is plausible enough to
 * publish. A network failure cannot fail a valid record — it just skips the
 * check, because hiding a verified shop rate over a third-party outage would be
 * worse than showing it with its date.
 */
async function spotConverted24k(): Promise<number | null> {
  const cached = referenceCache.__tulsiIndiaReference;
  if (cached && Date.now() - cached.at < REFERENCE_TTL_MS) return cached.value;

  let value: number | null = null;
  try {
    const payload = (await fetchJsonWithRetry(SPOT_GOLD_ENDPOINT, {})) as {
      price?: unknown;
    };
    const usd = typeof payload.price === "number" ? payload.price : Number(payload.price);
    if (Number.isFinite(usd) && usd > 0) {
      const fx = await usdToInr();
      const perGram = inrPerGram(usd * fx.rate, "toz");
      if (perGram !== null) value = Math.round(perGram * 10 * 100) / 100;
    }
  } catch {
    value = null;
  }

  referenceCache.__tulsiIndiaReference = { at: Date.now(), value };
  return value;
}

export const indiaProvider: RateProvider = {
  kind: "external",
  recordAs: "india-mcx",
  sourceName: INDIA_RATE_SOURCE,
  label: "Indian market benchmark (MCX) — entered by the showroom",
  note:
    "Uses the showroom's verified Indian 24K per-10-gram figure and derives 22K, 20K, 18K and 14K " +
    "(×0.916, ×0.833, ×0.750, ×0.585) plus silver 999 per kg. Each value is checked against the " +
    "converted spot price before publication. Update content/rates/india-benchmark.json four times a day.",
  publication: "published",
  customerNote: INDIA_MARKET_NOTE,
  // Four readings a day is the freshness the showroom aims for; the UI uses
  // this to decide when to offer a refresh, never to claim a number is live.
  refreshMinutes: 360,
  /**
   * Deliberately free of `Date.now()`: this is read while a page is being
   * prerendered, and Next refuses an unstable value there. The future-date and
   * reference checks run in `fetchLatest`, at request time.
   */
  isConfigured: () =>
    isPositiveNumber(INDIA_BENCHMARK.gold24kPer10g) &&
    isPositiveNumber(INDIA_BENCHMARK.silverPerKg) &&
    typeof INDIA_BENCHMARK.observedAt === "string" &&
    !Number.isNaN(Date.parse(INDIA_BENCHMARK.observedAt)),

  async fetchLatest(): Promise<ProviderFetchResult> {
    if (typeof window !== "undefined") {
      throw new Error("A rate provider may only be called from the server.");
    }

    const validation = validateIndiaBenchmark(INDIA_BENCHMARK);
    if (!validation.ok || !isPositiveNumber(INDIA_BENCHMARK.gold24kPer10g)) {
      throw new Error(
        `The Indian benchmark is incomplete: ${validation.problems.join("; ")}.`,
      );
    }

    const reference = await spotConverted24k();
    const check = referenceCheck(INDIA_BENCHMARK.gold24kPer10g, reference);
    if (!check.ok) {
      // Held for review: publishing a figure this far from the market would be
      // worse than showing the previous verified value.
      throw new Error(`Held for review — ${check.reason}. Nothing was published.`);
    }

    const notes = [
      `Source: ${INDIA_RATE_SOURCE}, ${INDIA_BENCHMARK.observedAt}.`,
      "Every purity is derived from the 24K base with the Indian rate-sheet convention.",
    ];
    if (check.ratio !== null) {
      notes.push(
        `Reference check passed: Indian 24K is ${(check.ratio * 100 - 100).toFixed(1)}% versus converted spot.`,
      );
    } else {
      notes.push("Reference check skipped: the spot reference was unavailable.");
    }

    return {
      observedAt: INDIA_BENCHMARK.observedAt as string,
      currency: "INR",
      rates: toRawRates(INDIA_BENCHMARK),
      notes,
    };
  },
};
