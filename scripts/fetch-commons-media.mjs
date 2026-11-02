#!/usr/bin/env node
/**
 * scripts/fetch-commons-media.mjs
 *
 * Downloads real, licence-checked jewellery photographs from Wikimedia Commons
 * for the Collections and Popular Designs pages.
 *
 * WHY WIKIMEDIA
 * ─────────────
 * Every file on Commons states its author and licence in machine-readable form,
 * so the credit on /image-credits is the photographer's own statement rather
 * than something typed from memory. Only licences that allow commercial use are
 * accepted: public domain, CC0, CC BY and CC BY-SA. Anything NonCommercial,
 * NoDerivatives or "fair use" is refused, and so is a file with no licence at
 * all. Nothing is copied from another jeweller's website.
 *
 * WHAT IT WRITES
 * ──────────────
 *   public/media/stock/<key>.jpg          a 1600 px-wide JPEG thumbnail
 * and prints one manifest entry per image (key, dimensions, alt, credit) so the
 * human running it can review the picture before it goes into the manifest.
 * It never edits public/media/manifest.json itself: choosing whether a photo is
 * the right picture of the right style is an editorial decision, not a script's.
 *
 * Usage:  node scripts/fetch-commons-media.mjs [--download]
 * Without --download it only reports what it found (a dry run).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API = "https://commons.wikimedia.org/w/api.php";
const UA =
  "TulsiJewellersMediaFetcher/1.0 (https://tulsijewellerswebsite.vercel.app; contact via site)";
const DOWNLOAD = process.argv.includes("--download");
const OUT_DIR = join(process.cwd(), "public", "media", "stock");

/** key → the Commons search that should find a photograph of it. */
const TARGETS = [
  { key: "goldNecklaceIndia", query: "gold necklace India traditional", hint: /necklace|haar|gold/i },
  { key: "goldBanglesSet", query: "gold bangles India", hint: /bangle|churi|kada|bracelet|gold/i },
  { key: "jhumkaGold", query: "jhumka earrings", hint: /jhumka|earring|ear ring|gold/i },
  { key: "mangalsutraBeads", query: "mangalsutra", hint: /mangalsutra|thali|necklace/i },
  { key: "silverAnklets", query: "silver anklet India", hint: /anklet|payal|silver/i },
  { key: "pearlStrand", query: "pearl necklace jewellery", hint: /pearl|necklace/i },
  { key: "diamondRingWhite", query: "diamond ring", hint: /diamond|ring/i },
  { key: "emeraldRingGold", query: "emerald ring gold", hint: /emerald|ring/i },
  { key: "goldEarringsIndia", query: "gold earrings India", hint: /earring|ear ring|gold/i },
  { key: "goldBiscuit", query: "gold bar bullion", hint: /gold|bar|ingot|bullion/i },
  { key: "bridalJewelleryIndia", query: "Indian bride jewellery", hint: /bride|bridal|jewell?ery|necklace/i },
  { key: "silverJewellerySet", query: "silver jewellery India", hint: /silver|jewell?ery/i },
];

const ALLOWED = /^(cc0|cc by(-sa)? \d|public domain|pd)/i;
const REFUSED = /\b(nc|nd)\b|non-?commercial|no-?deriv|fair use|copyright/i;

/** Strip the small amount of HTML Commons returns inside extmetadata. */
function text(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`Commons answered ${response.status}`);
  return response.json();
}

async function search(query) {
  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1600",
  });
  return Object.values(data?.query?.pages ?? {});
}

function credit(page) {
  const info = page.imageinfo?.[0];
  const meta = info?.extmetadata ?? {};
  const license = text(meta.LicenseShortName?.value);
  if (!license || !ALLOWED.test(license) || REFUSED.test(license)) return null;
  const artist = text(meta.Artist?.value) || "Unknown (Wikimedia Commons)";
  return {
    provider: "Wikimedia Commons",
    title: `File:${page.title.replace(/^File:/, "")}`,
    creator: artist,
    license,
    licenseUrl: meta.LicenseUrl?.value ? String(meta.LicenseUrl.value) : null,
    page: info.descriptionurl,
    sourceUrl: info.url,
    thumbUrl: info.thumburl,
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
const chosen = [];

for (const target of TARGETS) {
  try {
    const pages = await search(target.query);
    const match = pages
      .map((page) => ({ page, credit: credit(page) }))
      .find(
        ({ page, credit: entry }) =>
          entry && entry.thumbUrl && entry.width >= 900 && target.hint.test(page.title),
      );

    if (!match) {
      console.log(`– ${target.key}: no licence-clean match for "${target.query}"`);
      continue;
    }

    const entry = match.credit;
    console.log(`✓ ${target.key}: ${entry.title} [${entry.license}] ${entry.width}×${entry.height}`);
    chosen.push({ key: target.key, entry });

    if (DOWNLOAD) {
      const response = await fetch(entry.thumbUrl, { headers: { "User-Agent": UA } });
      if (!response.ok) throw new Error(`download answered ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      writeFileSync(join(OUT_DIR, `${target.key}.jpg`), bytes);
      console.log(`   saved public/media/stock/${target.key}.jpg (${Math.round(bytes.length / 1024)} kB)`);
    }
  } catch (error) {
    console.log(`✗ ${target.key}: ${error.message}`);
  }
}

console.log("\nManifest entries (review each picture before adding it):\n");
console.log(
  JSON.stringify(
    chosen.map(({ key, entry }) => ({
      key,
      src: `/media/stock/${key}.jpg`,
      width: 1600,
      height: Math.round((1600 * entry.height) / entry.width),
      category: "jewellery",
      alt: { en: entry.title.replace(/^File:/, "").replace(/\.(jpe?g|png)$/i, ""), hi: "" },
      credit: {
        provider: entry.provider,
        title: entry.title,
        creator: entry.creator,
        license: entry.license,
        licenseUrl: entry.licenseUrl,
        page: entry.page,
        sourceUrl: entry.sourceUrl,
      },
    })),
    null,
    2,
  ),
);
console.log(`\n${DOWNLOAD ? "Downloaded" : "Found"} ${chosen.length} of ${TARGETS.length}.`);
