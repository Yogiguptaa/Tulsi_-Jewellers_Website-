/**
 * catalogue/images.ts — the single reader of the media manifest.
 *
 * `public/media/manifest.json` holds every photograph and video the storefront
 * ships: its dimensions, a tiny blur placeholder, bilingual alt text, category
 * and its licence. `scripts/sync-media.ts` (Pexels/Pixabay) and
 * `scripts/build-media-manifest.mjs` write that file; components read only it.
 *
 * Nothing here is a product listing. These are editorial photographs for the
 * hero, category banners and the "design inspiration" strip. An owner-uploaded
 * product photo arrives as a direct Storage URL and is passed straight through
 * with a portrait reservation, because it has no manifest entry.
 */

import type { LocalizedText } from "@/lib/config";
import manifest from "../../../public/media/manifest.json";
import placeholderFile from "../../../public/media/stock/placeholder.svg";

export type MediaCredit = {
  /** Library the file came from — "Wikimedia Commons", "Pexels", "Pixabay". */
  provider: string;
  title: string;
  creator: string;
  license: string;
  licenseUrl: string | null;
  /** Public page for the original work. */
  page: string;
  /** The file the local copy was made from. */
  sourceUrl: string;
};

export type MediaAsset = {
  key: string;
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
  category: string;
  alt: LocalizedText;
  credit: MediaCredit;
  kind?: "photo" | "video";
  /** Poster image path for a video asset. */
  poster?: string;
};

export type CatalogueImage = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

export const MEDIA_ASSETS = (manifest as { assets: MediaAsset[] }).assets;

const BY_KEY = new Map(MEDIA_ASSETS.map((asset) => [asset.key, asset]));
const BY_SRC = new Map(MEDIA_ASSETS.map((asset) => [asset.src, asset]));

/** Neutral monogram tile: what an unknown key renders instead of nothing. */
export const FALLBACK_IMAGE: CatalogueImage = placeholderFile;
export const FALLBACK_IMAGE_SRC = placeholderFile.src;

/** A path/URL the owner has supplied but the manifest does not describe. */
const UNREGISTERED: Omit<CatalogueImage, "src"> = { width: 1200, height: 1500 };

/** True for anything that is already a servable URL rather than a manifest key. */
function isDirectSrc(key: string): boolean {
  return key.startsWith("/") || /^https?:\/\//.test(key);
}

export function assetForKey(key: string): MediaAsset | null {
  return BY_KEY.get(key) ?? BY_SRC.get(key) ?? null;
}

export function imageFor(key: string): CatalogueImage {
  const asset = assetForKey(key);
  if (asset) {
    return {
      src: asset.src,
      width: asset.width,
      height: asset.height,
      blurDataURL: asset.blurDataURL,
    };
  }
  if (key && isDirectSrc(key)) return { src: key, ...UNREGISTERED };
  return FALLBACK_IMAGE;
}

/** Plain URL for metadata, JSON-LD and anything that cannot take an <Image>. */
export function imageSrc(key: string): string {
  return imageFor(key).src;
}

export function creditFor(key: string): MediaCredit | null {
  return assetForKey(key)?.credit ?? null;
}

export function imageCredit(
  key: string,
): { credit: string; license: string; page: string; provider: string } | null {
  const entry = creditFor(key);
  if (!entry) return null;
  return {
    credit: entry.creator,
    license: entry.license,
    page: entry.page,
    provider: entry.provider,
  };
}

/** Localized alt text from the manifest; the caller's fallback if unregistered. */
export function imageAlt(key: string, fallback: LocalizedText): LocalizedText {
  return assetForKey(key)?.alt ?? fallback;
}

/** True when nothing is registered for the key and the monogram tile is used. */
export function isFallback(key: string): boolean {
  return !assetForKey(key) && !isDirectSrc(key);
}

/**
 * Libraries actually represented in the manifest, in first-seen order.
 * The footer prints these (Pexels' licence asks for a visible credit) and links
 * to /image-credits for the full table.
 */
export function mediaProviders(): string[] {
  const seen: string[] = [];
  for (const asset of MEDIA_ASSETS) {
    if (asset.credit?.provider && !seen.includes(asset.credit.provider)) {
      seen.push(asset.credit.provider);
    }
  }
  return seen;
}
