import { describe, expect, it } from "vitest";

import {
  REFERENCE_CEILING,
  REFERENCE_FLOOR,
  benchmarkAgeHours,
  deriveGoldPer10g,
  deriveSilver,
  goldPerGram,
  referenceCheck,
  round2,
  toRawRates,
  validateIndiaBenchmark,
} from "@/lib/rates/india";

const BASE_24K = 142_024;

describe("Indian purity derivation", () => {
  it("derives every purity from the 24K base with market convention", () => {
    const rows = deriveGoldPer10g(BASE_24K);
    const byPurity = Object.fromEntries(rows.map((row) => [row.purity, row.rate]));

    expect(byPurity["999"]).toBe(BASE_24K);
    expect(byPurity["916"]).toBe(round2(BASE_24K * 0.916));
    expect(byPurity["833"]).toBe(round2(BASE_24K * 0.833));
    expect(byPurity["750"]).toBe(round2(BASE_24K * 0.75));
    expect(byPurity["585"]).toBe(round2(BASE_24K * 0.585));
  });

  it("matches the exact factors in the brief", () => {
    const byPurity = Object.fromEntries(
      deriveGoldPer10g(100_000).map((row) => [row.purity, row.rate]),
    );
    expect(byPurity["916"]).toBe(91_600);
    expect(byPurity["833"]).toBe(83_300);
    expect(byPurity["750"]).toBe(75_000);
    expect(byPurity["585"]).toBe(58_500);
  });

  it("shows a per-gram figure", () => {
    expect(goldPerGram(BASE_24K)).toBe(14_202.4);
  });

  it("derives silver per gram and 925 from the 999 per-kg base", () => {
    const silver = deriveSilver(195_719);
    expect(silver).not.toBeNull();
    expect(silver?.perKg).toBe(195_719);
    expect(silver?.perGram).toBe(195.72);
    expect(silver?.silver925PerKg).toBe(round2(195_719 * 0.925));
    expect(silver?.silver925PerGram).toBe(round2(round2(195_719 * 0.925) / 1000));
  });

  it("produces six rows for a complete benchmark and none for an empty one", () => {
    expect(toRawRates({ gold24kPer10g: BASE_24K, silverPerKg: 195_719, observedAt: null }))
      .toHaveLength(6);
    expect(toRawRates({ gold24kPer10g: null, silverPerKg: null, observedAt: null })).toHaveLength(0);
  });

  it("never emits zero or NaN for a missing or nonsensical base", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(deriveGoldPer10g(bad)).toHaveLength(0);
      expect(goldPerGram(bad)).toBeNull();
      expect(deriveSilver(bad)).toBeNull();
    }
  });
});

describe("Indian benchmark validation", () => {
  const valid = {
    gold24kPer10g: BASE_24K,
    silverPerKg: 195_719,
    observedAt: "2026-10-26T18:00:00+05:30",
  };

  it("accepts a complete, plausible record", () => {
    expect(validateIndiaBenchmark(valid, Date.parse("2026-11-04T00:00:00Z")).ok).toBe(true);
  });

  it("rejects a record with no figures", () => {
    const result = validateIndiaBenchmark(
      { gold24kPer10g: null, silverPerKg: null, observedAt: null },
      Date.parse("2026-11-04T00:00:00Z"),
    );
    expect(result.ok).toBe(false);
    expect(result.problems.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects a decimal-point slip", () => {
    const result = validateIndiaBenchmark(
      { ...valid, gold24kPer10g: 14_202.4 },
      Date.parse("2026-11-04T00:00:00Z"),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a timestamp in the future", () => {
    const result = validateIndiaBenchmark(
      { ...valid, observedAt: "2027-01-01T00:00:00Z" },
      Date.parse("2026-11-04T00:00:00Z"),
    );
    expect(result.ok).toBe(false);
  });

  it("reports how old a figure is", () => {
    const now = Date.parse("2026-11-04T00:00:00Z");
    const age = benchmarkAgeHours("2026-10-26T18:00:00+05:30", now);
    expect(age).toBeGreaterThan(190);
    expect(benchmarkAgeHours("not a date", now)).toBeNull();
    expect(benchmarkAgeHours(null, now)).toBeNull();
  });
});

describe("reference check against converted spot", () => {
  const spot24k = 120_547.52;

  it("accepts an Indian figure inside the 0.97–1.30 band", () => {
    const result = referenceCheck(BASE_24K, spot24k);
    expect(result.ok).toBe(true);
    expect(result.ratio).toBeGreaterThan(REFERENCE_FLOOR);
    expect(result.ratio).toBeLessThan(REFERENCE_CEILING);
  });

  it("rejects a figure more than 3% below spot", () => {
    const result = referenceCheck(spot24k * 0.9, spot24k);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/below/i);
  });

  it("rejects a figure more than 30% above spot", () => {
    const result = referenceCheck(spot24k * 1.31, spot24k);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/above/i);
  });

  it("cannot fail when the reference is unavailable", () => {
    expect(referenceCheck(BASE_24K, null).ok).toBe(true);
    expect(referenceCheck(BASE_24K, 0).ok).toBe(true);
  });
});
