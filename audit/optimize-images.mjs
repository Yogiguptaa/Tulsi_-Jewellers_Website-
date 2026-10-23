/**
 * audit/optimize-images.mjs — shrink the demonstration photographs in /public/demo.
 *
 * These files are full-size Wikimedia downloads (up to 1.5 MB, 1280 px wide) that
 * the site reuses for 62 px thumbnails and ~350 px cards. This script decodes each
 * one in Chrome, redraws it at a sensible maximum width and re-encodes it, keeping
 * the same file name and format so no reference has to change.
 *
 *   node audit/optimize-images.mjs          # report only
 *   node audit/optimize-images.mjs --apply  # rewrite the files
 *
 * The images are served by the dev server, so the canvas stays same-origin and
 * `toDataURL` is allowed. Run against a running dev server.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3210").replace(/\/$/, "");
const APPLY = process.argv.includes("--apply");
const MAX_EDGE = 1100; // widest the photos are ever displayed, at 2x
const QUALITY = 0.82;

const DIR = path.join(process.cwd(), "public", "demo");
const files = fs
  .readdirSync(DIR)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const ctx = await browser.newContext();
const page = await ctx.newPage();
// Navigate to the dev server first: an image is only same-origin (and therefore
// readable by canvas) relative to a page on that origin.
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });

let before = 0;
let after = 0;
const rows = [];

for (const file of files) {
  const filePath = path.join(DIR, file);
  const bytes = fs.statSync(filePath).size;
  before += bytes;

  const result = await page.evaluate(
    async ({ url, maxEdge, quality }) => {
      const img = new Image();
      img.src = url;
      await img.decode().catch(
        () =>
          new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("decode failed"));
          }),
      );
      const { naturalWidth: w0, naturalHeight: h0 } = img;
      const scale = Math.min(1, maxEdge / Math.max(w0, h0));
      const w = Math.round(w0 * scale);
      const h = Math.round(h0 * scale);

      // Does this PNG use transparency? (matters for a lossy re-encode)
      const probe = document.createElement("canvas");
      probe.width = Math.min(w0, 64);
      probe.height = Math.min(h0, 64);
      const pctx = probe.getContext("2d");
      pctx.drawImage(img, 0, 0, probe.width, probe.height);
      const px = pctx.getImageData(0, 0, probe.width, probe.height).data;
      let transparent = false;
      for (let i = 3; i < px.length; i += 4) {
        if (px[i] < 250) {
          transparent = true;
          break;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const c = canvas.getContext("2d");
      c.imageSmoothingQuality = "high";
      c.drawImage(img, 0, 0, w, h);
      const isPng = /\.png$/i.test(url);
      const type = isPng && transparent ? "image/png" : "image/jpeg";
      const out = canvas.toDataURL(type, quality);
      return { w0, h0, w, h, transparent, type, data: out };
    },
    { url: `${BASE}/demo/${file}`, maxEdge: MAX_EDGE, quality: QUALITY },
  );

  const dataUrl = result.data;
  const encoded = Buffer.from(dataUrl.split(",")[1], "base64");
  const keepOriginal = encoded.length >= bytes * 0.95;
  const written = keepOriginal ? bytes : encoded.length;
  after += written;
  rows.push({
    file,
    before: bytes,
    after: written,
    size: `${result.w0}x${result.h0}`,
    newSize: `${result.w}x${result.h}`,
    type: result.type.replace("image/", ""),
    action: keepOriginal ? "skip (no gain)" : APPLY ? "written" : "would shrink",
  });

  if (APPLY && !keepOriginal) fs.writeFileSync(filePath, encoded);
}

await browser.close();

const pad = (s, n) => String(s).padEnd(n);
console.log(pad("file", 30), pad("before", 10), pad("after", 10), pad("size", 12), pad("new", 12), "action");
for (const r of rows) {
  console.log(
    pad(r.file, 30),
    pad(`${(r.before / 1024).toFixed(0)}KB`, 10),
    pad(`${(r.after / 1024).toFixed(0)}KB`, 10),
    pad(r.size, 12),
    pad(r.newSize, 12),
    r.action,
  );
}
console.log(
  `\nTotal: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB ` +
    `(${APPLY ? "applied" : "dry run — pass --apply to write"})`,
);
