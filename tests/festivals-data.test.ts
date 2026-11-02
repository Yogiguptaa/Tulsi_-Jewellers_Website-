import { describe, expect, it } from "vitest";
import { FESTIVALS } from "@/lib/festivals/data";
import { isoToUtc } from "@/lib/festivals/select";

/**
 * Integrity of the calendar itself. A wrong date here would tell customers the
 * wrong day for Dhanteras, so the rules are enforced rather than trusted.
 */
describe("festival calendar integrity", () => {
  it("has entries", () => {
    expect(FESTIVALS.length).toBeGreaterThan(0);
  });

  it("uses unique slugs", () => {
    const slugs = FESTIVALS.map((festival) => festival.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses real calendar dates with the end on or after the start", () => {
    for (const festival of FESTIVALS) {
      expect(isoToUtc(festival.dateStart), `${festival.slug} start`).not.toBeNull();
      expect(isoToUtc(festival.dateEnd), `${festival.slug} end`).not.toBeNull();
      expect(festival.dateStart <= festival.dateEnd, `${festival.slug} is reversed`).toBe(true);
    }
  });

  it("keeps the countdown window sane", () => {
    for (const festival of FESTIVALS) {
      expect(festival.leadDays, `${festival.slug} lead`).toBeGreaterThanOrEqual(0);
      expect(festival.leadDays, `${festival.slug} lead`).toBeLessThanOrEqual(45);
      expect(festival.trailDays, `${festival.slug} trail`).toBeGreaterThanOrEqual(0);
      expect(festival.trailDays, `${festival.slug} trail`).toBeLessThanOrEqual(3);
      expect(festival.priority, `${festival.slug} priority`).toBeGreaterThan(0);
    }
  });

  it("backs every verified date with two independent https sources", () => {
    for (const festival of FESTIVALS) {
      if (!festival.verified) continue;
      expect(festival.sources.length, `${festival.slug} sources`).toBeGreaterThanOrEqual(2);
      const hosts = new Set(festival.sources.map((source) => new URL(source.url).host));
      expect(hosts.size, `${festival.slug} needs two independent sources`).toBeGreaterThanOrEqual(2);
      for (const source of festival.sources) {
        expect(source.url.startsWith("https://"), `${festival.slug} source is not https`).toBe(true);
        expect(source.label.trim().length, `${festival.slug} source label`).toBeGreaterThan(0);
      }
    }
  });

  it("carries customer copy in both languages", () => {
    for (const festival of FESTIVALS) {
      for (const field of ["name", "headline", "subline"] as const) {
        expect(festival[field].en.trim(), `${festival.slug} ${field}.en`).not.toBe("");
        expect(festival[field].hi.trim(), `${festival.slug} ${field}.hi`).not.toBe("");
      }
      for (const category of festival.categories) {
        expect(category.href.startsWith("/collections/"), `${festival.slug} category`).toBe(true);
        expect(category.label.hi.trim()).not.toBe("");
      }
    }
  });

  it("keeps the two 2026 dates that everything else is checked against", () => {
    const dhanteras = FESTIVALS.find((festival) => festival.slug === "dhanteras-2026");
    const diwali = FESTIVALS.find((festival) => festival.slug === "diwali-2026");
    expect(dhanteras?.dateStart).toBe("2026-11-06");
    expect(diwali?.dateStart).toBe("2026-11-08");
  });
});
