/**
 * Tests for the CSV importer — the gate that decides what may be published.
 *
 * Written in plain JavaScript because the importer itself is plain JavaScript and
 * is executed by Node before a build; keeping the test in the same language means
 * it exercises exactly the code the owner runs.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv, validateRecords } from "../scripts/lib/catalogue-import.mjs";

const COLUMNS = [
  "product_id",
  "name_en",
  "name_hi",
  "description_en",
  "description_hi",
  "category",
  "type",
  "style",
  "metal",
  "purity",
  "weight_grams",
  "stone_detail",
  "gemstone",
  "gender",
  "occasion",
  "image_1",
  "image_2",
  "image_3",
  "image_4",
  "availability",
  "catalogue_type",
  "supplier_name",
  "supplier_ref",
  "supplier_url",
  "price_inr",
  "featured",
  "last_updated",
];

const HEADER = COLUMNS.join(",");

const cell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function row(values = {}) {
  const filled = {
    product_id: "TJ-G-1001",
    name_en: "Temple gold necklace",
    description_en: "A 22K gold necklace in the temple style, kept at the counter.",
    category: "gold-jewellery",
    type: "necklaces",
    metal: "gold",
    purity: "22K",
    catalogue_type: "showroom",
    availability: "in_stock",
    image_1: "/media/stock/goldNecklaceAncient.jpg",
    last_updated: "2026-11-03",
    ...values,
  };
  return COLUMNS.map((column) => cell(filled[column])).join(",");
}

const csv = (...rows) => [HEADER, ...rows].join("\n");

describe("parseCsv", () => {
  it("keeps commas, quotes and newlines inside quoted fields", () => {
    const text = 'a,b\n"one, two","he said ""yes"""\n';
    const { header, records } = parseCsv(text);
    expect(header).toEqual(["a", "b"]);
    expect(records[0].values).toEqual({ a: "one, two", b: 'he said "yes"' });
  });

  it("skips comment rows and blank lines", () => {
    const text = "# a note, with a comma\na,b\n\n1,2\n";
    const { records } = parseCsv(text);
    expect(records).toHaveLength(1);
    expect(records[0].values.a).toBe("1");
  });
});

describe("validateRecords", () => {
  it("accepts a complete showroom row", () => {
    const { products, errors } = validateRecords(csv(row()));
    expect(errors).toEqual([]);
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      code: "TJ-G-1001",
      slug: "temple-gold-necklace",
      catalogueType: "showroom",
      availability: "in_stock",
      priceType: "on_enquiry",
      priceINR: null,
      supplier: null,
      createdAt: "2026-11-03T00:00:00.000Z",
    });
  });

  it("falls back to the English text when Hindi is not supplied", () => {
    const { products } = validateRecords(csv(row()));
    expect(products[0].name.hi).toBe(products[0].name.en);
    expect(products[0].description.hi).toBe(products[0].description.en);
  });

  it("rejects a duplicate product id", () => {
    const { products, errors } = validateRecords(csv(row(), row({ name_en: "Another necklace" })));
    expect(products).toHaveLength(1);
    expect(errors.some((entry) => /duplicate product_id/i.test(entry.message))).toBe(true);
  });

  it("rejects a duplicate slug built from the same name", () => {
    const { errors } = validateRecords(csv(row(), row({ product_id: "TJ-G-1002" })));
    expect(errors.some((entry) => /duplicate slug/i.test(entry.message))).toBe(true);
  });

  it("refuses to publish an inspiration entry as in stock", () => {
    const { products, errors } = validateRecords(
      csv(row({ catalogue_type: "inspiration", availability: "in_stock" })),
    );
    expect(products).toHaveLength(0);
    expect(errors.some((entry) => /cannot be "in_stock"/i.test(entry.message))).toBe(true);
  });

  it("refuses a price on an inspiration or supplier design", () => {
    for (const type of ["inspiration", "supplier"]) {
      const { errors } = validateRecords(
        csv(
          row({
            catalogue_type: type,
            availability: "on_enquiry",
            supplier_name: "Authorised House",
            price_inr: "48000",
          }),
        ),
      );
      expect(errors.some((entry) => /may not carry a price/i.test(entry.message))).toBe(true);
    }
  });

  it("requires a supplier name for a supplier design", () => {
    const { errors } = validateRecords(csv(row({ catalogue_type: "supplier" })));
    expect(errors.some((entry) => /supplier_name is required/i.test(entry.message))).toBe(true);
  });

  it("rejects the same supplier reference twice", () => {
    const { errors } = validateRecords(
      csv(
        row({
          product_id: "TJ-P-1",
          name_en: "Supplier kundan one",
          catalogue_type: "supplier",
          availability: "on_enquiry",
          supplier_name: "Authorised House",
          supplier_ref: "KN-14",
        }),
        row({
          product_id: "TJ-P-2",
          name_en: "Supplier kundan two",
          catalogue_type: "supplier",
          availability: "on_enquiry",
          supplier_name: "Authorised House",
          supplier_ref: "kn-14",
        }),
      ),
    );
    expect(errors.some((entry) => /duplicate supplier record/i.test(entry.message))).toBe(true);
  });

  it("rejects a missing or broken image", () => {
    const missing = validateRecords(csv(row({ image_1: "" })));
    expect(missing.errors.some((entry) => /image_1 is required/i.test(entry.message))).toBe(true);

    const absent = validateRecords(csv(row({ image_1: "/media/stock/not-a-real-file.jpg" })));
    expect(absent.errors.some((entry) => /not found/i.test(entry.message))).toBe(true);

    const remote = validateRecords(csv(row({ image_1: "https://example.com/ring.jpg" })));
    expect(remote.errors.some((entry) => /not an allowed image host/i.test(entry.message))).toBe(true);
  });

  it("accepts a Cloudinary delivery URL and warns when it is untransformed", () => {
    const { products, errors, warnings } = validateRecords(
      csv(row({ image_1: "https://res.cloudinary.com/demo/image/upload/v1/ring.jpg" })),
    );
    expect(errors).toEqual([]);
    expect(products[0].imageKeys).toEqual(["https://res.cloudinary.com/demo/image/upload/v1/ring.jpg"]);
    expect(warnings.some((entry) => /f_auto\/q_auto/.test(entry.message))).toBe(true);
  });

  it("rejects an unknown category, type, metal or gemstone", () => {
    for (const [column, value, pattern] of [
      ["category", "diamonds", /category must be one of/i],
      ["type", "tiaras", /type must be one of/i],
      ["metal", "platinum", /metal must be one of/i],
      ["gemstone", "diamond", /gemstone must be one of/i],
    ]) {
      const { errors } = validateRecords(csv(row({ [column]: value })));
      expect(errors.some((entry) => pattern.test(entry.message))).toBe(true);
    }
  });

  it("requires a purity for gold and silver instead of guessing one", () => {
    const gold = validateRecords(csv(row({ purity: "" })));
    expect(gold.errors.some((entry) => /purity is required for gold/i.test(entry.message))).toBe(true);

    const silver = validateRecords(
      csv(row({ metal: "silver", purity: "", category: "silver-jewellery" })),
    );
    expect(silver.errors.some((entry) => /purity is required for silver/i.test(entry.message))).toBe(true);
  });

  it("rejects a non-numeric weight and a malformed date", () => {
    const weight = validateRecords(csv(row({ weight_grams: "about twelve" })));
    expect(weight.errors.some((entry) => /weight_grams must be a positive number/i.test(entry.message))).toBe(
      true,
    );

    const date = validateRecords(csv(row({ last_updated: "03/11/2026" })));
    expect(date.errors.some((entry) => /last_updated must be a real date/i.test(entry.message))).toBe(true);
  });

  it("rejects the required columns being absent", () => {
    const { products, errors } = validateRecords("product_id,name_en\nTJ-1,Necklace\n");
    expect(products).toEqual([]);
    expect(errors[0].message).toMatch(/missing required column/i);
  });

  it("accepts a header-only file as an empty catalogue", () => {
    const { products, errors } = validateRecords(`${HEADER}\n`);
    expect(products).toEqual([]);
    expect(errors).toEqual([]);
  });

  it("validates the shipped sample file end to end", () => {
    const sample = readFileSync(
      path.join(process.cwd(), "content/catalogue/products.sample.csv"),
      "utf8",
    );
    const { products, errors } = validateRecords(sample);
    expect(errors).toEqual([]);
    expect(products).toHaveLength(8);
    expect(products.filter((entry) => entry.catalogueType === "showroom")).toHaveLength(6);
    expect(products.filter((entry) => entry.catalogueType === "inspiration")).toHaveLength(1);
    expect(products.filter((entry) => entry.catalogueType === "supplier")).toHaveLength(1);
  });
});
