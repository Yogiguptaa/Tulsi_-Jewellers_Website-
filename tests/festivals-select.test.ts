import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  istDate,
  selectFestival,
  windowOf,
} from "@/lib/festivals/select";
import { FESTIVALS } from "@/lib/festivals/data";
import type { Festival } from "@/lib/festivals/types";

function festival(overrides: Partial<Festival> & Pick<Festival, "slug">): Festival {
  return {
    name: { en: "Test", hi: "परीक्षण" },
    dateStart: "2026-11-06",
    dateEnd: "2026-11-06",
    leadDays: 14,
    trailDays: 0,
    priority: 10,
    verified: true,
    sources: [
      { label: "A", url: "https://example.com/a" },
      { label: "B", url: "https://example.com/b" },
    ],
    headline: { en: "Headline", hi: "शीर्षक" },
    subline: { en: "Subline", hi: "उपशीर्षक" },
    categories: [],
    ...overrides,
  };
}

describe("calendar arithmetic", () => {
  it("reads the date on the showroom clock, not the server clock", () => {
    // 19:00 UTC on 5 November is 00:30 IST on 6 November.
    expect(istDate(new Date("2026-11-05T19:00:00Z"))).toBe("2026-11-06");
    // 18:00 UTC on 5 November is still 23:30 IST on the 5th.
    expect(istDate(new Date("2026-11-05T18:00:00Z"))).toBe("2026-11-05");
  });

  it("adds days across a leap day and a year boundary", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-06", -14)).toBe("2026-10-23");
  });

  it("counts whole days in both directions", () => {
    expect(daysBetween("2026-11-02", "2026-11-06")).toBe(4);
    expect(daysBetween("2026-11-08", "2026-11-06")).toBe(-2);
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31);
  });

  it("rejects impossible dates instead of rolling them over", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow();
    expect(selectFestival(FESTIVALS, "not-a-date")).toBeNull();
  });

  it("opens the window exactly leadDays before the festival", () => {
    const entry = festival({ slug: "w", dateStart: "2026-11-06", leadDays: 14 });
    expect(windowOf(entry)).toEqual({ start: "2026-10-23", end: "2026-11-06" });
  });
});

describe("selecting the festival to show", () => {
  it("shows Dhanteras four days out, ahead of Diwali", () => {
    const selection = selectFestival(FESTIVALS, "2026-11-02");
    expect(selection?.festival.slug).toBe("dhanteras-2026");
    expect(selection?.phase).toBe("upcoming");
    expect(selection?.daysUntil).toBe(4);
  });

  it("switches to the greeting on the day itself", () => {
    const selection = selectFestival(FESTIVALS, "2026-11-06");
    expect(selection?.festival.slug).toBe("dhanteras-2026");
    expect(selection?.phase).toBe("today");
    expect(selection?.daysUntil).toBe(0);
  });

  it("moves to Diwali once Dhanteras is over", () => {
    const selection = selectFestival(FESTIVALS, "2026-11-07");
    expect(selection?.festival.slug).toBe("diwali-2026");
    expect(selection?.phase).toBe("upcoming");
    expect(selection?.daysUntil).toBe(1);
  });

  it("renders nothing when no window is open", () => {
    // Early January: Makar Sankranti's 10-day lead has not started.
    expect(selectFestival(FESTIVALS, "2026-01-01")).toBeNull();
    // Mid-December 2026: every 2026 entry is behind us.
    expect(selectFestival(FESTIVALS, "2026-12-20")).toBeNull();
  });

  it("never shows an unverified date", () => {
    const unverified = festival({ slug: "guess", verified: false });
    expect(selectFestival([unverified], "2026-11-01")).toBeNull();
  });

  it("prefers what is happening today over what is coming", () => {
    const today = festival({ slug: "today", dateStart: "2026-11-06", dateEnd: "2026-11-06", priority: 1 });
    const soon = festival({
      slug: "soon",
      dateStart: "2026-11-08",
      dateEnd: "2026-11-08",
      leadDays: 14,
      priority: 99,
    });
    expect(selectFestival([soon, today], "2026-11-06")?.festival.slug).toBe("today");
  });

  it("prefers the nearer festival, then the higher priority", () => {
    const near = festival({
      slug: "near",
      dateStart: "2026-11-07",
      dateEnd: "2026-11-07",
      priority: 1,
    });
    const far = festival({
      slug: "far",
      dateStart: "2026-11-12",
      dateEnd: "2026-11-12",
      priority: 99,
    });
    expect(selectFestival([far, near], "2026-11-01")?.festival.slug).toBe("near");

    const sameDayLow = festival({ slug: "low", dateStart: "2026-11-07", dateEnd: "2026-11-07", priority: 1 });
    const sameDayHigh = festival({
      slug: "high",
      dateStart: "2026-11-07",
      dateEnd: "2026-11-07",
      priority: 50,
    });
    expect(selectFestival([sameDayLow, sameDayHigh], "2026-11-01")?.festival.slug).toBe("high");
  });

  it("keeps a greeting for the trail day, but never shows a past date", () => {
    const entry = festival({
      slug: "trail",
      dateStart: "2026-11-06",
      dateEnd: "2026-11-06",
      trailDays: 1,
    });
    const dayAfter = selectFestival([entry], "2026-11-07");
    expect(dayAfter?.phase).toBe("justPassed");
    // The strip prints the greeting and no date for this phase.
    expect(selectFestival([entry], "2026-11-08")).toBeNull();
  });

  it("treats a multi-day festival as one window", () => {
    const multi = festival({
      slug: "multi",
      dateStart: "2026-09-14",
      dateEnd: "2026-09-25",
      leadDays: 0,
      trailDays: 0,
    });
    expect(selectFestival([multi], "2026-09-15")?.phase).toBe("today");
    expect(selectFestival([multi], "2026-09-25")?.phase).toBe("today");
    expect(selectFestival([multi], "2026-09-26")).toBeNull();
  });

  it("survives a festival whose end is before its start", () => {
    const broken = festival({ slug: "broken", dateStart: "2026-11-09", dateEnd: "2026-11-06" });
    expect(selectFestival([broken], "2026-11-07")).toBeNull();
  });
});
