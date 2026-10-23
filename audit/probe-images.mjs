/**
 * audit/probe-images.mjs — did every photograph on a page actually load?
 *
 * Reads every <img> after the page has been scrolled end to end, then again a
 * couple of seconds later. Useful when the harness reports "naturalWidth 0"
 * entries: this tells you whether a file is genuinely missing or the picture was
 * simply still in flight when the measurement was taken.
 *
 * Usage: node audit/probe-images.mjs [baseUrl]
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = (process.argv[2] ?? "http://localhost:3210").replace(/\/$/, "");
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

const TARGETS = [
  ["/", 390],
  ["/collections", 1440],
  ["/gems", 390],
  ["/jewellery/rings", 1440],
  ["/products/classic-gold-ring-demo", 390],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

for (const [route, width] of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 45000 });
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });

  const measure = () =>
    page.evaluate(() => {
      const imgs = [...document.querySelectorAll("img")];
      return {
        total: imgs.length,
        missing: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
        stillLoading: imgs.filter((i) => !i.complete).length,
        missingList: imgs
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => (i.currentSrc || i.src).slice(-70)),
      };
    });

  const now = await measure();
  await page.waitForTimeout(2500);
  const later = await measure();
  console.log(
    `${route} @${width}px — immediate: ${JSON.stringify(now)}\n` +
      `${" ".repeat(route.length)}            after 2.5s: ${JSON.stringify(later)}`,
  );
  await ctx.close();
}

await browser.close();
