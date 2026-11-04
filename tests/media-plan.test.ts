import { describe, expect, it } from "vitest";

import {
  COLLECTION_PLANS,
  MIN_LONG_EDGE,
  PLANS,
  PLAN_BY_SLUG,
  coverage,
  isSuitable,
  planTotals,
} from "@/lib/media/plan";

const good = {
  set: "gold-jewellery",
  alt: "22K gold necklace set on a dark background",
  width: 2000,
  height: 1500,
};

describe("realistic media gate", () => {
  it("accepts a real gold photograph that is large enough", () => {
    expect(isSuitable(good).ok).toBe(true);
  });

  it("rejects costume, imitation and artificial jewellery", () => {
    for (const alt of [
      "costume jewellery necklace",
      "imitation gold necklace",
      "artificial jewellery set",
      "plastic bangles",
      "rhinestone earrings",
      "brass necklace",
      "gold plated fashion jewellery",
    ]) {
      const result = isSuitable({ ...good, alt });
      expect(result.ok, alt).toBe(false);
    }
  });

  it("rejects museum, antique and illustrated pictures", () => {
    for (const alt of [
      "antique gold necklace museum",
      "vintage jewellery collection",
      "watercolour painting of a necklace",
      "vector illustration gold ring",
      "3d render of bangles",
    ]) {
      expect(isSuitable({ ...good, alt }).ok, alt).toBe(false);
    }
  });

  it("rejects pictures of people rather than the piece", () => {
    for (const alt of [
      "bride wearing gold necklace",
      "woman model with earrings",
      "portrait of a girl in jewellery",
      "hand holding a ring",
    ]) {
      expect(isSuitable({ ...good, alt }).ok, alt).toBe(false);
    }
  });

  it("rejects a small image even when the wording is right", () => {
    expect(isSuitable({ ...good, width: MIN_LONG_EDGE - 1, height: 900 }).ok).toBe(false);
    expect(isSuitable({ ...good, width: 2400, height: 1200 }).ok).toBe(true);
  });

  it("rejects a photograph whose description does not name the metal", () => {
    expect(isSuitable({ ...good, alt: "necklace on a table" }).ok).toBe(false);
  });

  it("rejects an unknown set instead of filing the photo anywhere", () => {
    expect(isSuitable({ ...good, set: "not-a-set" }).ok).toBe(false);
  });

  it("requires a description so nothing is accepted unverified", () => {
    expect(isSuitable({ ...good, alt: "", tags: "" }).ok).toBe(false);
  });
});

describe("media plan", () => {
  it("asks for 100 photographs in every collection and six per design", () => {
    for (const plan of COLLECTION_PLANS) {
      expect(plan.target, plan.slug).toBe(100);
    }
    for (const plan of PLANS.filter((entry) => entry.kind !== "collection")) {
      expect(plan.target, plan.slug).toBe(6);
    }
  });

  it("covers every collection the shop actually sells", () => {
    const slugs = COLLECTION_PLANS.map((plan) => plan.slug);
    for (const slug of [
      "gold-jewellery",
      "gold-coins",
      "gold-biscuits",
      "silver-jewellery",
      "diamond-jewellery",
      "fancy-jewellery",
      "gems",
    ]) {
      expect(slugs).toContain(slug);
    }
  });

  it("never plans a costume or artificial set", () => {
    const text = PLANS.map((plan) => `${plan.slug} ${plan.queries.join(" ")}`).join(" ");
    expect(text).not.toMatch(/costume|imitation|artificial/i);
  });

  it("totals the expected volume", () => {
    const totals = planTotals();
    expect(totals.collections).toBe(7);
    expect(totals.photographs).toBe(7 * 100 + 12 * 6 + 5 * 6);
  });

  it("counts only tagged photographs, so untagged legacy files are not claimed", () => {
    const rows = coverage([{ set: "gold-jewellery" }, {}, { set: "gold-jewellery" }]);
    const gold = rows.find((row) => row.slug === "gold-jewellery");
    expect(gold?.have).toBe(2);
    expect(gold?.target).toBe(100);
  });

  it("has a plan for every design and occasion set", () => {
    expect(PLAN_BY_SLUG["mens-chains"]?.target).toBe(6);
    expect(PLAN_BY_SLUG["daily-wear"]?.kind).toBe("occasion");
  });
});
