/**
 * rates/calculator.ts — pure metal-value estimator.
 *
 * It multiplies the stored rate by the weight the visitor enters. Nothing else
 * is added: making charges depend on the design and are settled at the shop, and
 * taxes depend on the final bill, so printing a total here would be a quote we
 * cannot stand behind. The output is always labelled an estimate.
 */

import type { RateObservation } from "./types";

export type CalculatorInput = {
  metal: "gold" | "silver";
  /** Fineness string that matches the recorded series, e.g. "916". */
  purity: string;
  weightGrams: number;
};

export type CalculatorResult = {
  /** Null when no rate exists for the chosen series — never 0. */
  metalValue: number | null;
  rateUsed: RateObservation | null;
};

export function metalValueFor(
  metal: "gold" | "silver",
  rate: number,
  weightGrams: number,
): number {
  // Gold is quoted per 10 g, silver per kg.
  return metal === "gold" ? (rate * weightGrams) / 10 : (rate * weightGrams) / 1000;
}

export function estimate(input: CalculatorInput, rate: RateObservation | null): CalculatorResult {
  if (!rate || !Number.isFinite(rate.rate) || rate.rate <= 0 || !(input.weightGrams > 0)) {
    return { metalValue: null, rateUsed: rate };
  }
  return {
    metalValue: metalValueFor(input.metal, rate.rate, input.weightGrams),
    rateUsed: rate,
  };
}
