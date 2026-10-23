/**
 * scripts/sync-media.ts — fetch licence-safe editorial photography and short
 * videos, self-host them, and record the credit.
 *
 *   npm run sync:media            (Pexels + Pixabay, whichever keys exist)
 *   npm run sync:media -- --dry   (search and print only, download nothing)
 *
 * Why a build-time script: the site must never call Pexels/Pixabay from a page
 * view (rate limits, privacy, and a broken image whenever a key expires). This
 * script downloads once into public/media/<category>/, converts photos to WebP
 * at 1600 px, picks a small video rendition, writes public/media/manifest.json
 * and appends each asset to public/images/CREDITS.md. Components read only the
 * manifest.
 *
 * Keys live in .env.local (never committed, never in client code):
 *   PEXELS_API_KEY=...
 *   PIXABAY_API_KEY=...
 *
 * Licences: Pexels and Pixabay both allow commercial use without attribution,
 * but Pexels asks for a visible credit, so /image-credits lists every file and
 * the footer names the library. No identifiable faces are used deliberately:
 * the search terms are jewellery and showroom close-ups, and any result whose
 * alt/tags mention a model, bride or person is skipped.
 *
 * No ffmpeg in this environment: videos are stored as the provider's smallest
 * rendition under 20 MB, so they remain playable without re-encoding.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type ProviderName = "Pexels" | "Pixabay";
type Kind = "photo" | "video";

type ManifestAsset = {
  key: string;
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
  category: string;
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
  kind?: Kind;
  poster?: string;
};

type Manifest = {
  generatedAt: string;
  note?: string;
  assets: ManifestAsset[];
};

type Query = {
  category: string;
  query: string;
  /** How many photos to keep from this query. */
  photos: number;
  videos?: number;
};

const QUERIES: Query[] = [
  { category: "rings", query: "gold ring jewellery close up", photos: 3 },
  { category: "necklaces", query: "gold necklace indian jewellery", photos: 3 },
  { category: "bridal", query: "indian bridal jewellery gold", photos: 3 },
  { category: "bangles", query: "gold bangles jewellery", photos: 3 },
  { category: "earrings", query: "gold earrings jewellery", photos: 3 },
  { category: "mangalsutra", query: "mangalsutra black beads gold", photos: 2 },
  { category: "anklets", query: "silver anklet jewellery", photos: 2 },
  { category: "silver", query: "silver jewellery", photos: 2 },
  { category: "diamond", query: "diamond ring jewellery", photos: 3 },
  { category: "gemstones", query: "gemstone jewellery ring", photos: 3 },
  { category: "showroom", query: "jewellery showroom display", photos: 3 },
  { category: "coins", query: "gold coins bullion", photos: 2 },
  { category: "hero", query: "gold jewellery dark background", photos: 2, videos: 2 },
];

const PHOTO_MAX_WIDTH = 1600;
const PHOTO_QUALITY = 82;
const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
const VIDEO_MAX_SECONDS = 16;
const USER_AGENT = "TulsiJewellersMediaSync/1.0 (+https://tulsijewellers.example)";

const root = process.cwd();
const mediaRoot = path.join(root, "public/media");
const manifestFile = path.join(mediaRoot, "manifest.json");
const creditsFile = path.join(root, "public/images/CREDITS.md");
const dryRun = process.argv.includes("--dry");

/* -------------------------------------------------------------------------- */
/* env                                                                        */
/* -------------------------------------------------------------------------- */

async function readEnvLocal(): Promise<Record<string, string>> {
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
      // absent is normal in a fresh checkout
    }
  }
  return { ...env, ...process.env } as Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/* http                                                                       */
/* -------------------------------------------------------------------------- */

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
  }
  return response.json();
}

/** API payload shapes, limited to the fields this script reads. */
type PexelsPhoto = {
  id: number;
  url: string;
  alt?: string;
  photographer?: string;
  src?: { original?: string; large2x?: string; large?: string };
};
type PexelsVideoFile = { link: string; width?: number; size?: number };
type PexelsVideo = {
  id: number;
  url: string;
  duration?: number;
  image?: string;
  user?: { name?: string };
  video_files?: PexelsVideoFile[];
};
type PixabayPhoto = {
  id: number;
  pageURL: string;
  tags?: string;
  user?: string;
  largeImageURL?: string;
  webformatURL?: string;
};
type PixabayVideoFile = { url?: string; width?: number; size?: number };
type PixabayVideo = {
  id: number;
  pageURL: string;
  duration?: number;
  user?: string;
  videos?: Record<string, PixabayVideoFile>;
};

async function getBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

/* -------------------------------------------------------------------------- */
/* processing                                                                 */
/* -------------------------------------------------------------------------- */

async function savePhoto(buffer: Buffer, target: string): Promise<{ width: number; height: number; blurDataURL: string }> {
  const pipeline = sharp(buffer).rotate();
  const out = await pipeline
    .resize({ width: PHOTO_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: PHOTO_QUALITY })
    .toBuffer({ resolveWithObject: true });
  await writeFile(target, out.data);

  const tiny = await sharp(buffer)
    .resize(16, 20, { fit: "inside" })
    .blur(1.2)
    .webp({ quality: 35 })
    .toBuffer();

  return {
    width: out.info.width,
    height: out.info.height,
    blurDataURL: `data:image/webp;base64,${tiny.toString("base64")}`,
  };
}

/** Cheap safety filter: editorial jewellery, never a portrait of a person. */
function looksLikePortrait(text: string): boolean {
  return /\b(model|woman|girl|bride|bridegroom|man|person|portrait|face|hand model)\b/i.test(text);
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* -------------------------------------------------------------------------- */
/* providers                                                                  */
/* -------------------------------------------------------------------------- */

type Candidate = {
  provider: ProviderName;
  kind: Kind;
  id: string;
  page: string;
  creator: string;
  title: string;
  alt: string;
  /** Photo source or the chosen video rendition. */
  url: string;
  poster?: string;
  duration?: number;
  size?: number;
};

async function pexelsPhotos(key: string, query: Query): Promise<Candidate[]> {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query.query)}` +
    `&per_page=8&orientation=portrait&size=large`;
  const data = (await getJson(url, { Authorization: key })) as { photos?: PexelsPhoto[] };
  return (data.photos ?? [])
    .filter((photo) => !looksLikePortrait(`${photo.alt ?? ""} ${photo.url ?? ""}`))
    .map((photo) => ({
      provider: "Pexels" as const,
      kind: "photo" as const,
      id: String(photo.id),
      page: photo.url,
      creator: photo.photographer ?? "Pexels contributor",
      title: photo.alt ?? query.query,
      alt: photo.alt ?? `Jewellery photograph: ${query.query}`,
      url: photo.src?.large2x ?? photo.src?.large ?? photo.src?.original ?? "",
    }))
    .filter((candidate) => Boolean(candidate.url));
}

async function pexelsVideos(key: string, query: Query): Promise<Candidate[]> {
  const url =
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query.query)}` +
    `&per_page=4&orientation=portrait&size=small`;
  const data = (await getJson(url, { Authorization: key })) as { videos?: PexelsVideo[] };
  const candidates: Candidate[] = [];
  for (const video of data.videos ?? []) {
    if (!video.video_files?.length) continue;
    if (Number(video.duration) > VIDEO_MAX_SECONDS) continue;
    const file = [...video.video_files]
      .filter((entry) => entry.link && Number(entry.width) >= 540)
      .sort((a, b) => Number(a.width) - Number(b.width))[0];
    if (!file) continue;
    candidates.push({
      provider: "Pexels",
      kind: "video",
      id: String(video.id),
      page: video.url,
      creator: video.user?.name ?? "Pexels contributor",
      title: `Short jewellery video: ${query.query}`,
      alt: `Short jewellery video: ${query.query}`,
      url: file.link,
      poster: video.image,
      duration: Number(video.duration),
      size: Number(file.size ?? 0) || undefined,
    });
  }
  return candidates;
}

async function pixabayPhotos(key: string, query: Query): Promise<Candidate[]> {
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(query.query)}&image_type=photo&orientation=vertical` +
    `&per_page=8&safesearch=true`;
  const data = (await getJson(url, {})) as { hits?: PixabayPhoto[] };
  return (data.hits ?? [])
    .filter((hit) => !looksLikePortrait(`${hit.tags ?? ""}`))
    .map((hit) => ({
      provider: "Pixabay" as const,
      kind: "photo" as const,
      id: String(hit.id),
      page: hit.pageURL,
      creator: hit.user ?? "Pixabay contributor",
      title: hit.tags ?? query.query,
      alt: hit.tags ? `Jewellery: ${hit.tags}` : `Jewellery photograph: ${query.query}`,
      url: hit.largeImageURL ?? hit.webformatURL ?? "",
    }))
    .filter((candidate) => Boolean(candidate.url));
}

async function pixabayVideos(key: string, query: Query): Promise<Candidate[]> {
  const url =
    `https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}` +
    `&q=${encodeURIComponent(query.query)}&per_page=4&safesearch=true`;
  const data = (await getJson(url, {})) as { hits?: PixabayVideo[] };
  const candidates: Candidate[] = [];
  for (const hit of data.hits ?? []) {
    if (Number(hit.duration) > VIDEO_MAX_SECONDS) continue;
    const renditions = Object.values(hit.videos ?? {}) as PixabayVideoFile[];
    const file = renditions
      .filter((entry) => entry?.url && Number(entry.width) >= 480)
      .sort((a, b) => Number(a.width) - Number(b.width))[0];
    if (!file) continue;
    candidates.push({
      provider: "Pixabay",
      kind: "video",
      id: String(hit.id),
      page: hit.pageURL,
      creator: hit.user ?? "Pixabay contributor",
      title: `Short jewellery video: ${query.query}`,
      alt: `Short jewellery video: ${query.query}`,
      url: file.url ?? "",
      duration: Number(hit.duration),
      size: Number(file.size ?? 0) || undefined,
    });
  }
  return candidates;
}

/* -------------------------------------------------------------------------- */
/* credits                                                                    */
/* -------------------------------------------------------------------------- */

const LICENCE_URL: Record<ProviderName, string> = {
  Pexels: "https://www.pexels.com/license/",
  Pixabay: "https://pixabay.com/service/license-summary/",
};

const CREDIT_START = "<!-- sync-media:start -->";
const CREDIT_END = "<!-- sync-media:end -->";

async function writeCredits(assets: ManifestAsset[]): Promise<void> {
  const rows = assets
    .filter((asset) => asset.credit.provider === "Pexels" || asset.credit.provider === "Pixabay")
    .map(
      (asset) =>
        `| \`${asset.src}\` | ${asset.credit.creator.replace(/\|/g, "/")} | ${asset.credit.license} | [file](${asset.credit.sourceUrl}) | [page](${asset.credit.page}) |`,
    );

  const section = [
    CREDIT_START,
    "## Pexels / Pixabay assets (managed by `npm run sync:media`)",
    "",
    "Both libraries allow commercial use without attribution. Pexels asks for a",
    "visible credit, which the footer and [/image-credits](/image-credits) provide.",
    "",
    "| File | Creator | Licence | File | Source page |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    CREDIT_END,
  ].join("\n");

  let text = "";
  try {
    text = await readFile(creditsFile, "utf8");
  } catch {
    text = "# Image credits\n";
  }
  const start = text.indexOf(CREDIT_START);
  const end = text.indexOf(CREDIT_END);
  if (start >= 0 && end > start) {
    text = text.slice(0, start) + section + text.slice(end + CREDIT_END.length);
  } else {
    text = `${text.trimEnd()}\n\n${section}\n`;
  }
  await writeFile(creditsFile, text, "utf8");
}

/* -------------------------------------------------------------------------- */
/* main                                                                       */
/* -------------------------------------------------------------------------- */

const env = await readEnvLocal();
const pexelsKey = (env.PEXELS_API_KEY ?? "").trim();
const pixabayKey = (env.PIXABAY_API_KEY ?? "").trim();

if (!pexelsKey && !pixabayKey) {
  console.log(
    [
      "No media keys found, so nothing was downloaded.",
      "",
      "1. Create a free Pexels API key: https://www.pexels.com/api/",
      "   (and/or a Pixabay key: https://pixabay.com/api/docs/)",
      "2. Add them to .env.local:",
      "     PEXELS_API_KEY=...",
      "     PIXABAY_API_KEY=...",
      "3. Run: npm run sync:media",
      "",
      "Until then the site uses the photographs already listed in",
      "public/media/manifest.json, with gradients/monograms as fallback — no",
      "broken images, and no external requests at page view.",
    ].join("\n"),
  );
  process.exit(0);
}

const manifest: Manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const knownSources = new Set(manifest.assets.map((asset) => asset.credit.sourceUrl));
const added: ManifestAsset[] = [];
const failures: string[] = [];

for (const entry of QUERIES) {
  const candidates: Candidate[] = [];

  try {
    if (pexelsKey) {
      candidates.push(...(await pexelsPhotos(pexelsKey, entry)));
      if (entry.videos) candidates.push(...(await pexelsVideos(pexelsKey, entry)));
    }
  } catch (error) {
    failures.push(`Pexels ${entry.query}: ${(error as Error).message}`);
  }

  try {
    if (pixabayKey) {
      candidates.push(...(await pixabayPhotos(pixabayKey, entry)));
      if (entry.videos) candidates.push(...(await pixabayVideos(pixabayKey, entry)));
    }
  } catch (error) {
    failures.push(`Pixabay ${entry.query}: ${(error as Error).message}`);
  }

  const photos = candidates.filter((candidate) => candidate.kind === "photo").slice(0, entry.photos);
  const videos = candidates.filter((candidate) => candidate.kind === "video").slice(0, entry.videos ?? 0);
  const chosen = [...photos, ...videos];

  for (const candidate of chosen) {
    if (knownSources.has(candidate.page)) continue;

    const dir = path.join(mediaRoot, entry.category);
    await mkdir(dir, { recursive: true });
    const base = `${slug(candidate.provider)}-${candidate.id}`;

    try {
      if (dryRun) {
        console.log(`[dry] ${candidate.provider} ${candidate.kind} → ${entry.category}/${base}`);
        continue;
      }

      if (candidate.kind === "photo") {
        const buffer = await getBuffer(candidate.url);
        const target = path.join(dir, `${base}.webp`);
        const saved = await savePhoto(buffer, target);
        added.push({
          key: `${entry.category}-${base}`,
          src: `/media/${entry.category}/${base}.webp`,
          width: saved.width,
          height: saved.height,
          blurDataURL: saved.blurDataURL,
          category: entry.category,
          alt: { en: candidate.alt, hi: candidate.alt },
          credit: {
            provider: candidate.provider,
            title: candidate.title,
            creator: candidate.creator,
            license: candidate.provider === "Pexels" ? "Pexels licence" : "Pixabay licence",
            licenseUrl: LICENCE_URL[candidate.provider],
            page: candidate.page,
            sourceUrl: candidate.page,
          },
          kind: "photo",
        });
      } else {
        if (candidate.size && candidate.size > VIDEO_MAX_BYTES) {
          failures.push(`${candidate.provider} video ${candidate.id}: larger than 20 MB, skipped`);
          continue;
        }
        const buffer = await getBuffer(candidate.url);
        if (buffer.byteLength > VIDEO_MAX_BYTES) {
          failures.push(`${candidate.provider} video ${candidate.id}: larger than 20 MB, skipped`);
          continue;
        }
        const extension = candidate.url.includes(".webm") ? "webm" : "mp4";
        const target = path.join(dir, `${base}.${extension}`);
        await writeFile(target, buffer);

        let posterPath: string | undefined;
        if (candidate.poster) {
          try {
            const poster = await getBuffer(candidate.poster);
            const posterSaved = await savePhoto(
              poster,
              path.join(dir, `${base}-poster.webp`),
            );
            posterPath = `/media/${entry.category}/${base}-poster.webp`;
            added.push({
              key: `${entry.category}-${base}-poster`,
              src: posterPath,
              width: posterSaved.width,
              height: posterSaved.height,
              blurDataURL: posterSaved.blurDataURL,
              category: entry.category,
              alt: { en: candidate.alt, hi: candidate.alt },
              credit: {
                provider: candidate.provider,
                title: `${candidate.title} (poster)`,
                creator: candidate.creator,
                license: candidate.provider === "Pexels" ? "Pexels licence" : "Pixabay licence",
                licenseUrl: LICENCE_URL[candidate.provider],
                page: candidate.page,
                sourceUrl: `${candidate.page}#poster`,
              },
              kind: "photo",
            });
          } catch {
            posterPath = undefined;
          }
        }

        added.push({
          key: `${entry.category}-${base}`,
          src: `/media/${entry.category}/${base}.${extension}`,
          width: Number(candidate.poster ? 1080 : 720),
          height: Number(candidate.poster ? 1920 : 1280),
          category: entry.category,
          alt: { en: candidate.alt, hi: candidate.alt },
          credit: {
            provider: candidate.provider,
            title: candidate.title,
            creator: candidate.creator,
            license: candidate.provider === "Pexels" ? "Pexels licence" : "Pixabay licence",
            licenseUrl: LICENCE_URL[candidate.provider],
            page: candidate.page,
            sourceUrl: candidate.page,
          },
          kind: "video",
          poster: posterPath,
        });
      }

      knownSources.add(candidate.page);
      console.log(`added ${entry.category}/${base}`);
    } catch (error) {
      failures.push(`${candidate.provider} ${candidate.id}: ${(error as Error).message}`);
    }
  }
}

if (!dryRun) {
  manifest.assets.push(...added);
  manifest.generatedAt = new Date().toISOString();
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeCredits(manifest.assets);
}

console.log(
  [
    "",
    `added ${added.length} asset(s); ${manifest.assets.length} in the manifest`,
    failures.length ? `skipped/failed:\n  ${failures.join("\n  ")}` : "no failures",
    "Run `node scripts/build-media-manifest.mjs` to refresh dimensions/blur, then `npm run build`.",
  ].join("\n"),
);
