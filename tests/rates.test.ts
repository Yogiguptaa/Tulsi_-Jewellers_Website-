import { describe, expect, it } from "vitest";
import { estimate, metalValueFor } from "@/lib/rates/calculator";
import {
  ageLabel,
  formatDate,
  formatDateTime,
  formatDelta,
  formatINR,
  formatRate,
  unitLabel,
} from "@/lib/rates/format";
import type { RateObservation } from "@/lib/rates/types";

const gold22: RateObservation = {
  id: "gold-916",
  metal: "gold",
  purity: "916",
  unit: "INR_PER_10_GRAM",
  rate: 116_087,
  source: "spot converted to INR",
  session: "PM",
  gstIncluded: false,
  makingChargesIncluded: false,
  observedAt: "2026-11-02T05:00:00.000Z",
  fetchedAt: "2026-11-02T05:01:00.000Z",
};

const silver: RateObservation = { ...gold22, id: "silver-999", metal: "silver", purity: "999", unit: "INR_PER_KG", rate: 178_555 };

describe("metal value", () => {
  it("divides gold by ten grams and silver by a kilogram", () => {
    expect(metalValueFor("gold", 100_000, 10)).toBe(100_000);
    expect(metalValueFor("gold", 100_000, 5)).toBe(50_000);
    expect(metalValueFor("silver", 200_000, 500)).toBe(100_000);
  });

  it("estimates from the published rate for the chosen purity", () => {
    const result = estimate({ metal: "gold", purity: "916", weightGrams: 8 }, gold22);
    expect(result.metalValue).toBeCloseTo(92_869.6, 1);
    expect(result.rateUsed?.purity).toBe("916");
  });

  it("returns null rather than zero when there is no rate", () => {
    expect(estimate({ metal: "gold", purity: "916", weightGrams: 8 }, null).metalValue).toBeNull();
    expect(estimate({ metal: "gold", purity: "916", weightGrams: 0 }, gold22).metalValue).toBeNull();
    expect(
      estimate({ metal: "silver", purity: "999", weightGrams: 100 }, { ...silver, rate: 0 }).metalValue,
    ).toBeNull();
  });
});

describe("rate formatting", () => {
  it("groups rupees in the Indian style", () => {
    expect(formatINR(98_760)).toBe("98,760");
    expect(formatINR(1_26_606.4)).toBe("1,26,606");
    expect(formatINR(0)).toBe("0");
  });

  it("never prints a dash or a zero as a rate", () => {
    expect(formatRate(null, "INR_PER_10_GRAM")).toBeNull();
    expect(formatRate(0, "INR_PER_10_GRAM")).toBeNull();
    expect(formatRate(Number.NaN, "INR_PER_10_GRAM")).toBeNull();
    expect(formatRate(116_087, "INR_PER_10_GRAM")).toBe("₹ 1,16,087 / 10 g");
    expect(formatRate(178_555, "INR_PER_KG")).toBe("₹ 1,78,555 / kg");
  });

  it("labels units per ten grams and per kilogram", () => {
    expect(unitLabel("INR_PER_10_GRAM")).toBe("/ 10 g");
    expect(unitLabel("INR_PER_KG")).toBe("/ kg");
  });

  it("states a change with a sign, or says there is none", () => {
    expect(formatDelta(0, 0)).toBe("no change");
    expect(formatDelta(1_200, 1.03)).toBe("+₹ 1,200 (+1.03%)");
    expect(formatDelta(-800, -0.69)).toBe("−₹ 800 (−0.69%)");
    expect(formatDelta(null, null)).toBeNull();
  });

  it("describes age honestly and stops at null", () => {
    const now = Date.parse("2026-11-02T12:00:00.000Z");
    expect(ageLabel("2026-11-02T11:59:30.000Z", now)).toBe("just now");
    expect(ageLabel("2026-11-02T11:00:00.000Z", now)).toBe("1 hours ago");
    expect(ageLabel("2026-11-02T11:10:00.000Z", now)).toBe("50 minutes ago");
    expect(ageLabel("2026-10-31T12:00:00.000Z", now)).toBe("2 days ago");
    expect(ageLabel(null, now)).toBeNull();
    expect(ageLabel("nonsense", now)).toBeNull();
  });

  it("uses India time and names the zone", () => {
    // 18:30 UTC is midnight on 3 November in India — the zone shift is the point.
    const label = formatDateTime("2026-11-02T18:30:00.000Z", "en");
    expect(label).toContain("3 Nov 2026");
    expect(formatDateTime("2026-11-02T05:00:00.000Z", "en")).toContain("2 Nov 2026");
    expect(label?.toLowerCase()).toContain("ist");
    expect(formatDateTime(null)).toBeNull();
    expect(formatDate("2026-11-06T00:00:00.000Z", "en")).toContain("2026");
  });
});
