import { describe, expect, it } from "vitest";
import {
  COLLECTION_DESIGN_SLUGS,
  DESIGNS,
  DESIGN_BY_SLUG,
  JEWEL_TYPE_DESIGN_SLUGS,
  designPhotosForCollection,
  designPhotosForType,
} from "@/lib/designs";
import { COLLECTIONS } from "@/lib/config";
import { JEWEL_TYPES } from "@/lib/catalogue/jewel-types";
import manifest from "../public/media/manifest.json";

const assets = (manifest as { assets: { key: string }[] }).assets;
const assetKeys = new Set(assets.map((asset) => asset.key));

describe("collection design walls", () => {
  const collectionSlugs = COLLECTIONS.map((collection) => collection.slug);

  it("maps only real styles and real collection slugs", () => {
    const known = new Set(collectionSlugs);
    for (const [collection, styles] of Object.entries(COLLECTION_DESIGN_SLUGS)) {
      expect(known.has(collection), `unknown collection: ${collection}`).toBe(true);
      for (const style of styles) {
        expect(DESIGN_BY_SLUG[style], `unknown style: ${style}`).toBeTruthy();
      }
    }
  });

  it("gives every collection at least one photograph to show", () => {
    for (const slug of collectionSlugs) {
      expect(designPhotosForCollection(slug).length, `${slug} is empty`).toBeGreaterThan(0);
    }
  });

  it("never repeats a photograph inside one collection", () => {
    for (const slug of collectionSlugs) {
      const keys = designPhotosForCollection(slug).map((photo) => photo.key);
      expect(new Set(keys).size, `${slug} repeats a photograph`).toBe(keys.length);
    }
  });

  it("only references photographs that exist in the manifest", () => {
    for (const design of DESIGNS) {
      for (const key of design.images) {
        expect(assetKeys.has(key), `${design.slug} → ${key} is not in the manifest`).toBe(true);
      }
    }
  });

  it("maps jewellery-type pages to real styles and never repeats a photo", () => {
    const knownTypes = new Set(JEWEL_TYPES.map((type) => type.slug));
    for (const [type, styles] of Object.entries(JEWEL_TYPE_DESIGN_SLUGS)) {
      expect(knownTypes.has(type), `unknown type: ${type}`).toBe(true);
      for (const style of styles) {
        expect(DESIGN_BY_SLUG[style], `unknown style: ${style}`).toBeTruthy();
      }
      const keys = designPhotosForType(type).map((photo) => photo.key);
      expect(new Set(keys).size, `${type} repeats a photograph`).toBe(keys.length);
    }
  });

  it("keeps every style's link and name usable", () => {
    for (const design of DESIGNS) {
      expect(design.slug).toMatch(/^[a-z0-9-]+$/);
      expect(design.name.en.length).toBeGreaterThan(2);
      expect(design.name.hi.length).toBeGreaterThan(1);
      expect(design.enquiry.trim().length).toBeGreaterThan(2);
    }
  });
});
