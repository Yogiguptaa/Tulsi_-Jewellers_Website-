/**
 * Tests for the catalogue's pure logic: the vocabulary the importer validates
 * against, the provenance wording, and filter/sort/related behaviour.
 *
 * The point of the provenance block is that the rule is enforced here rather than
 * trusted to whoever edits a component next: an inspiration or supplier design
 * must never be described as being in the showroom.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COLLECTIONS, GEMSTONES } from "../src/lib/config";
import { JEWEL_TYPES } from "../src/lib/catalogue/jewel-types";
import {
  availabilityLabel,
  availabilityTone,
  enquiryMessage,
  isInShowroomStock,
  provenanceNotice,
  styleLabel,
  supplierLine,
} from "../src/lib/catalogue/catalogue-kind";
import {
  filterProducts,
  getRelated,
  matchesJewelTypeSlug,
  sortProducts,
} from "../src/lib/catalogue/select";
import type { Product } from "../src/lib/catalogue/types";

const vocabulary = JSON.parse(
  readFileSync(path.join(process.cwd(), "src/lib/catalogue/vocabulary.json"), "utf8"),
) as Record<string, string[]>;

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    code: "TJ-G-1001",
    slug: "temple-gold-necklace",
    name: { en: "Temple gold necklace", hi: "टेम्पल गोल्ड हार" },
    description: { en: "A 22K gold necklace in the temple style.", hi: "टेम्पल शैली का 22K सोने का हार।" },
    categorySlug: "gold-jewellery",
    type: "necklaces",
    style: "temple",
    metal: "gold",
    purity: "22K",
    gender: "women",
    occasion: "bridal",
    weightGrams: 42.5,
    gemstone: null,
    stoneDetail: null,
    priceType: "on_enquiry",
    priceINR: null,
    availability: "on_enquiry",
    isFeatured: false,
    createdAt: "2026-11-03T00:00:00.000Z",
    imageKeys: ["/media/stock/goldNecklaceAncient.jpg"],
    specs: [],
    catalogueType: "showroom",
    supplier: null,
    lastUpdated: "2026-11-03",
    ...overrides,
  };
}

describe("catalogue vocabulary", () => {
  it("matches the collection slugs the site actually routes", () => {
    expect([...vocabulary.collections].sort()).toEqual(COLLECTIONS.map((entry) => entry.slug).sort());
  });

  it("lists every jewellery type the Product type allows", () => {
    expect([...vocabulary.types].sort()).toEqual(
      [
        "rings",
        "necklaces",
        "earrings",
        "bangles",
        "bracelets",
        "chains",
        "pendants",
        "mangalsutra",
        "necklace-sets",
        "anklets",
        "coins-bars",
        "idols",
        "gemstones",
      ].sort(),
    );
    for (const page of JEWEL_TYPES.filter((entry) => entry.kind === "type")) {
      expect(vocabulary.types).toContain(page.slug);
    }
  });

  it("matches the enum values in types.ts", () => {
    expect([...vocabulary.metals].sort()).toEqual(["fashion", "gemstone", "gold", "silver"]);
    expect([...vocabulary.purities].sort()).toEqual(["14K", "18K", "20K", "22K", "24K", "925", "other"]);
    expect([...vocabulary.genders].sort()).toEqual(["kids", "men", "unisex", "women"]);
    expect([...vocabulary.occasions].sort()).toEqual(["bridal", "daily", "festive", "gifting"]);
    expect([...vocabulary.availability].sort()).toEqual(["in_stock", "on_enquiry", "sold_out"]);
    expect([...vocabulary.catalogueTypes].sort()).toEqual(["inspiration", "showroom", "supplier"]);
    expect([...vocabulary.gemstones].sort()).toEqual(GEMSTONES.map((entry) => entry.slug).sort());
  });
});

describe("provenance wording", () => {
  it("says a showroom piece is in the showroom only when it is recorded in stock", () => {
    const inStock = makeProduct({ availability: "in_stock" });
    expect(availabilityLabel(inStock, "en")).toBe("In the showroom");
    expect(availabilityTone(inStock)).toBe("stock");
    expect(isInShowroomStock(inStock)).toBe(true);

    const unpriced = makeProduct({ availability: "on_enquiry" });
    expect(availabilityLabel(unpriced, "en")).toBe("Ask availability");
    expect(isInShowroomStock(unpriced)).toBe(false);
    expect(availabilityLabel(unpriced, "en")).not.toMatch(/available now|in stock/i);
  });

  it("never presents an inspiration design as showroom stock", () => {
    // Even if bad data slipped through, the label still refuses the claim.
    const inspiration = makeProduct({ catalogueType: "inspiration", availability: "in_stock" });
    expect(availabilityLabel(inspiration, "en")).toMatch(/not showroom stock/i);
    expect(isInShowroomStock(inspiration)).toBe(false);
    expect(availabilityTone(inspiration)).toBe("design");
    expect(provenanceNotice(inspiration, "en")?.body).toMatch(/not a piece held in the showroom/i);
  });

  it("names the supplier and says a supplier design is ordered on request", () => {
    const supplier = makeProduct({
      catalogueType: "supplier",
      availability: "on_enquiry",
      supplier: { name: "Authorised Kundan House", ref: "KN-14", url: null },
    });
    expect(availabilityLabel(supplier, "en")).toMatch(/ordered on request/i);
    expect(supplierLine(supplier, "en")).toContain("Authorised Kundan House");
    expect(supplierLine(supplier, "en")).toContain("KN-14");
    expect(provenanceNotice(supplier, "en")?.body).toContain("Authorised Kundan House");
    expect(isInShowroomStock(supplier)).toBe(false);
  });

  it("has no provenance notice for a real showroom piece", () => {
    expect(provenanceNotice(makeProduct(), "en")).toBeNull();
    expect(supplierLine(makeProduct(), "en")).toBeNull();
  });

  it("puts the product name and code in every WhatsApp enquiry", () => {
    for (const catalogueType of ["showroom", "inspiration", "supplier"] as const) {
      const product = makeProduct({
        code: "TJ-X-77",
        catalogueType,
        supplier: catalogueType === "supplier" ? { name: "S", ref: null, url: null } : null,
      });
      const message = enquiryMessage(product);
      expect(message).toContain("Temple gold necklace");
      expect(message).toContain("TJ-X-77");
    }
  });

  it("prints a human label for known and unknown styles", () => {
    expect(styleLabel("daily-wear", "en")).toBe("Daily wear");
    expect(styleLabel("temple", "hi")).toBe("टेम्पल");
    expect(styleLabel("oxidised-silver", "en")).toBe("Oxidised Silver");
  });
});

describe("filters and sorting", () => {
  const showroom = makeProduct({ code: "A-1", slug: "a-1", availability: "in_stock" });
  const inspiration = makeProduct({
    code: "B-2",
    slug: "b-2",
    name: { en: "Bridal reference", hi: "ब्राइडल संदर्भ" },
    catalogueType: "inspiration",
    availability: "on_enquiry",
    style: "kundan",
  });
  const priced = makeProduct({
    code: "C-3",
    slug: "c-3",
    name: { en: "Silver anklets", hi: "चांदी की पायल" },
    type: "anklets",
    metal: "silver",
    purity: "925",
    style: null,
    occasion: "daily",
    priceType: "fixed",
    priceINR: 12500,
  });
  const list = [showroom, inspiration, priced];

  it("filters by catalogue type so an inspiration tile cannot return as stock", () => {
    expect(filterProducts(list, { catalogueType: "showroom" }).map((p) => p.code)).toEqual(["A-1", "C-3"]);
    expect(filterProducts(list, { catalogueType: "inspiration" }).map((p) => p.code)).toEqual(["B-2"]);
  });

  it("combines style, metal and search text", () => {
    expect(filterProducts(list, { style: "kundan" }).map((p) => p.code)).toEqual(["B-2"]);
    expect(filterProducts(list, { metal: "silver" }).map((p) => p.code)).toEqual(["C-3"]);
    expect(filterProducts(list, { query: "c-3" }).map((p) => p.code)).toEqual(["C-3"]);
    expect(filterProducts(list, { query: "चांदी" }).map((p) => p.code)).toEqual(["C-3"]);
    expect(filterProducts(list, { style: "kundan", metal: "gold" }).map((p) => p.code)).toEqual(["B-2"]);
    expect(filterProducts(list, { style: "kundan", metal: "silver" })).toEqual([]);
  });

  it("sorts unpriced products last in both price directions", () => {
    expect(sortProducts(list, "price_asc").map((p) => p.code).slice(-2).sort()).toEqual(["A-1", "B-2"]);
    expect(sortProducts(list, "price_asc")[0]?.code).toBe("C-3");
    expect(sortProducts(list, "price_desc")[0]?.code).toBe("C-3");
  });

  it("treats the bridal landing page as an occasion, not a collection", () => {
    expect(matchesJewelTypeSlug(showroom, "bridal-jewellery")).toBe(true);
    expect(matchesJewelTypeSlug(priced, "bridal-jewellery")).toBe(false);

    const ring = makeProduct({ type: "rings", occasion: "daily" });
    expect(matchesJewelTypeSlug(ring, "rings")).toBe(true);
    expect(matchesJewelTypeSlug(ring, "bridal-jewellery")).toBe(false);
    // A product type with no landing page of its own (anklets) must not be
    // silently matched onto an unrelated page.
    expect(matchesJewelTypeSlug(ring, "anklets")).toBe(false);
  });

  it("prefers related designs from the same provenance", () => {
    const related = getRelated([showroom, inspiration], inspiration, 4);
    expect(related.map((p) => p.code)).toEqual([showroom.code]);
    expect(getRelated([showroom], showroom, 4)).toEqual([]);
  });
});
