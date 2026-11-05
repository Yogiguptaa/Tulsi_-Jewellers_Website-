/**
 * scripts/sync-collections.ts — fill every collection, design and occasion set
 * with licence-safe, realistic gold/silver/diamond photography.
 *
 *   npm run sync:collections -- --dry     plan + current coverage, no network
 *   npm run sync:collections              download up to each set's target
 *   npm run sync:collections -- --only=gold-jewellery
 *
 * Keys (free, never committed): PEXELS_API_KEY, PIXABAY_API_KEY in `.env.local`.
 * Whichever key exists is used; with neither, the script reports the gap and
 * exits 0 so a build is never broken by a missing key.
 *
 * Every candidate passes `isSuitable()` (size, no costume/imitation/museum/
 * illustration wording, matching metal) and a perceptual-hash check against all
 * other photographs, so a set cannot be padded with the same picture twice.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { MIN_LONG_EDGE, PLANS, coverage, isSuitable, planTotals } from "../src/lib/media/plan.ts";

type Asset = {
  key: string;
  src: string;
  width: number;
  height: number;
  category: string;
  set?: string;
  alt: { en: string; hi: string };
  credit: {
    provider: string;
    title: string;
    creator: string;
    license: string;
    licenseUrl: string | null;
    page: string;
    sourceUrl: string;
  };
};

type Manifest = { generatedAt: string; note?: string; assets: Asset[] };

type Candidate = {
  provider: "Pexels" | "Pixabay";
  id: string;
  page: string;
  creator: string;
  license: string;
  licenseUrl: string | null;
  src: string;
  alt: string;
  width: number;
  height: number;
  tags?: string;
};

const root = process.cwd();
const mediaRoot = path.join(root, "public/media");
const manifestFile = path.join(mediaRoot, "manifest.json");
const USER_AGENT = "TulsiJewellersMediaSync/1.0";

const dryRun = process.argv.includes("--dry");
/** Prints why candidates were dropped instead of failing silently. */
const debug = process.argv.includes("--debug");
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
const plans = only ? PLANS.filter((plan) => plan.slug === only) : PLANS;

/* -------------------------------------------------------------------------- */
/* env + http                                                                  */
/* -------------------------------------------------------------------------- */

async function readEnv(): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  for (const file of [".env.local", ".env"]) {
    try {
      const text = await readFile(path.join(root, file), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (!match) continue;
        env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    } catch {
      // absent is normal
    }
  }
  return { ...env, ...process.env } as unknown as Record<string, string>;
}

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, ...headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/* -------------------------------------------------------------------------- */
/* providers                                                                   */
/* -------------------------------------------------------------------------- */

type PexelsPhoto = {
  id: number;
  url: string;
  alt?: string;
  photographer?: string;
  width: number;
  height: number;
  src?: { large2x?: string; original?: string; large?: string };
};

async function searchPexels(query: string, key: string, page: number): Promise<Candidate[]> {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
    `&per_page=80&page=${page}&orientation=landscape`;
  const body = (await getJson(url, { Authorization: key })) as { photos?: PexelsPhoto[] };
  return (body.photos ?? []).flatMap((photo) => {
    const src = photo.src?.large2x ?? photo.src?.original ?? photo.src?.large;
    if (!src) return [];
    return [
      {
        provider: "Pexels" as const,
        id: `pexels-${photo.id}`,
        page: photo.url,
        creator: photo.photographer ?? "Pexels contributor",
        license: "Pexels licence",
        licenseUrl: "https://www.pexels.com/license/",
        src,
        alt: photo.alt ?? "",
        width: photo.width,
        height: photo.height,
      },
    ];
  });
}

type PixabayHit = {
  id: number;
  pageURL: string;
  tags?: string;
  user?: string;
  /** 1920 px long edge; `largeImageURL` is only 1280 px. */
  fullHDURL?: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
};

async function searchPixabay(query: string, key: string, page: number): Promise<Candidate[]> {
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(query)}&image_type=photo&per_page=200&page=${page}` +
    `&min_width=${1600}&safesearch=true`;
  const body = (await getJson(url, {})) as { hits?: PixabayHit[] };
  return (body.hits ?? []).map((hit) => ({
    provider: "Pixabay" as const,
    id: `pixabay-${hit.id}`,
    page: hit.pageURL,
    creator: hit.user ?? "Pixabay contributor",
    license: "Pixabay licence",
    licenseUrl: "https://pixabay.com/service/license-summary/",
    src: hit.fullHDURL ?? hit.largeImageURL,
    alt: hit.tags ?? "",
    width: hit.imageWidth,
    height: hit.imageHeight,
    tags: hit.tags,
  }));
}

/* -------------------------------------------------------------------------- */
/* perceptual hash + download                                                  */
/* -------------------------------------------------------------------------- */

async function dhash(buffer: Buffer): Promise<string> {
  const raw = await sharp(buffer).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bits += raw[y * 9 + x] < raw[y * 9 + x + 1] ? "1" : "0";
    }
  }
  return bits;
}

/** Two photographs this close are the same shot cropped differently. */
const DUPLICATE_DISTANCE = 6;

function hamming(a: string, b: string): number {
  let different = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) different += 1;
  return different;
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/* -------------------------------------------------------------------------- */
/* run                                                                         */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const env = await readEnv();
  const pexels = env.PEXELS_API_KEY ?? "";
  const pixabay = env.PIXABAY_API_KEY ?? "";

  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Manifest;
  const report = coverage(manifest.assets);
  const totals = planTotals();

  console.log(
    `Plan: ${totals.collections} collections × 100, ${totals.designs} designs × 6, ` +
      `${totals.occasions} occasions × 6 = ${totals.photographs} photographs.`,
  );

  if (!pexels && !pixabay) {
    console.log("No PEXELS_API_KEY or PIXABAY_API_KEY found in .env.local.");
    console.log("Add either free key, then run: npm run sync:collections");
    console.log("\nCurrent coverage (tagged photographs only):");
    for (const row of report) {
      console.log(`  ${row.kind.padEnd(10)} ${row.slug.padEnd(32)} ${row.have}/${row.target}`);
    }
    return;
  }

  if (dryRun) {
    for (const row of report) {
      console.log(`  ${row.kind.padEnd(10)} ${row.slug.padEnd(32)} ${row.have}/${row.target}`);
    }
    return;
  }

  // Seed the duplicate check with the photographs already shipped.
  const hashes: string[] = [];
  for (const asset of manifest.assets) {
    if (!asset.src.startsWith("/media/")) continue;
    try {
      hashes.push(await dhash(await readFile(path.join(root, "public", asset.src))));
    } catch {
      // a missing legacy file simply does not seed a hash
    }
  }

  let added = 0;

  for (const plan of plans) {
    const have = manifest.assets.filter((asset) => asset.set === plan.slug).length;
    // Head start for the file name, so a second run cannot overwrite the first.
    let index = have;
    let needed = plan.target - have;
    if (needed <= 0) continue;

    console.log(`\n${plan.slug}: ${have}/${plan.target}`);
    const folder = path.join(mediaRoot, plan.slug);
    await mkdir(folder, { recursive: true });

    for (let page = 1; page <= 4 && needed > 0; page += 1) {
      for (const query of plan.queries) {
        if (needed <= 0) break;
        let candidates: Candidate[] = [];
        try {
          if (pexels) candidates = candidates.concat(await searchPexels(query, pexels, page));
          if (pixabay) candidates = candidates.concat(await searchPixabay(query, pixabay, page));
        } catch (error) {
          if (debug) console.log(`  search failed [${query} p${page}]:`, (error as Error).message);
          continue;
        }
        if (debug) console.log(`  [${query} p${page}] ${candidates.length} candidates`);

        for (const candidate of candidates) {
          if (needed <= 0) break;
          const gate = isSuitable({
            set: plan.slug,
            alt: candidate.alt,
            tags: candidate.tags,
            width: candidate.width,
            height: candidate.height,
          });
          if (!gate.ok) {
            if (debug) console.log(`    reject: ${gate.reason} — ${candidate.alt.slice(0, 70)}`);
            continue;
          }

          let buffer: Buffer;
          try {
            buffer = await download(candidate.src);
          } catch {
            continue;
          }

          let hash: string;
          let width: number;
          let height: number;
          try {
            const meta = await sharp(buffer).metadata();
            width = meta.width ?? 0;
            height = meta.height ?? 0;
            if (Math.max(width, height) < MIN_LONG_EDGE) {
              if (debug) console.log(`    reject: downloaded ${width}x${height} — ${candidate.alt.slice(0, 50)}`);
              continue;
            }
            hash = await dhash(buffer);
          } catch {
            continue;
          }
          if (hashes.some((existing) => hamming(existing, hash) <= DUPLICATE_DISTANCE)) continue;

          index += 1;
          const key = `${plan.slug}-${String(index).padStart(3, "0")}`;
          const file = `${key}.webp`;
          await sharp(buffer)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(path.join(folder, file));

          const resized = await sharp(path.join(folder, file)).metadata();
          const alt = candidate.alt.trim() || candidate.tags || plan.slug.replace(/-/g, " ");

          manifest.assets.push({
            key,
            src: `/media/${plan.slug}/${file}`,
            width: resized.width ?? width,
            height: resized.height ?? height,
            category: plan.slug,
            set: plan.slug,
            alt: { en: alt, hi: alt },
            credit: {
              provider: candidate.provider,
              title: alt,
              creator: candidate.creator,
              license: candidate.license,
              licenseUrl: candidate.licenseUrl,
              page: candidate.page,
              sourceUrl: candidate.src,
            },
          });
          hashes.push(hash);
          added += 1;
          needed -= 1;
        }
      }
    }
  }

  manifest.generatedAt = new Date().toISOString();
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`\nAdded ${added} photographs.`);
  for (const row of coverage(manifest.assets)) {
    console.log(`  ${row.kind.padEnd(10)} ${row.slug.padEnd(32)} ${row.have}/${row.target}`);
  }
}

await main();
