/**
 * scripts/build-media-manifest.mjs — refresh public/media/manifest.json from the
 * files actually on disk.
 *
 * It never invents a credit: an asset keeps the credit, alt text and category it
 * already has, and only its width/height/blur are regenerated. Entries whose
 * file has been deleted are dropped (with a warning); files that exist but have
 * no manifest entry are reported, not published — run `npm run sync:media` or
 * add the entry by hand so every photograph carries a licence.
 *
 *   node scripts/build-media-manifest.mjs
 */
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const mediaRoot = path.join(root, "public/media");
const manifestFile = path.join(mediaRoot, "manifest.json");

const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const kept = [];
const dropped = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

for (const asset of manifest.assets) {
  const file = path.join(root, "public", asset.src);
  try {
    await stat(file);
  } catch {
    dropped.push(asset.src);
    continue;
  }

  if ((asset.kind ?? "photo") === "photo") {
    try {
      const meta = await sharp(file).metadata();
      const tiny = await sharp(file)
        .resize(16, 20, { fit: "inside" })
        .blur(1.2)
        .webp({ quality: 35 })
        .toBuffer();
      asset.width = meta.width ?? asset.width;
      asset.height = meta.height ?? asset.height;
      asset.blurDataURL = `data:image/webp;base64,${tiny.toString("base64")}`;
    } catch {
      // A poster-less video or an unreadable file keeps its recorded size.
    }
  }

  kept.push(asset);
}

const onDisk = (await walk(mediaRoot))
  .map((file) => `/media/${path.relative(mediaRoot, file).split(path.sep).join("/")}`)
  .filter((src) => !src.endsWith("manifest.json"));

const registered = new Set(kept.map((asset) => asset.src));
const unregistered = onDisk.filter((src) => !registered.has(src));

manifest.assets = kept;
manifest.generatedAt = new Date().toISOString();
await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`manifest: ${kept.length} assets`);
if (dropped.length) console.log(`dropped (file missing): ${dropped.join(", ")}`);
if (unregistered.length) {
  console.log(
    `warning: ${unregistered.length} file(s) on disk are not in the manifest and were NOT published:\n  ${unregistered.join("\n  ")}`,
  );
}
