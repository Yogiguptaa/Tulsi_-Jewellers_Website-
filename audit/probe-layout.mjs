/**
 * audit/probe-layout.mjs — numbers for the things screenshots make you squint at.
 *
 * Checks the header at phone width (does the brand name fit, is anything
 * clipped), the hero photograph's rendered box and object-fit, the section
 * rhythm, and the footer heading levels.
 *
 * Usage: node audit/probe-layout.mjs [baseUrl]
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = (process.argv[2] ?? "http://localhost:3210").replace(/\/$/, "");
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

const describe = async (page) =>
  page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right) };
    };
    const brand = document.querySelector("header a[href='/']");
    const brandText = brand?.querySelector("span span");
    const nav = document.querySelector("header nav[aria-label='Primary']");
    const hero = document.querySelector("main img");
    const heroBox = hero?.parentElement;
    const sections = [...document.querySelectorAll("main section")].map((s) => {
      const cs = getComputedStyle(s);
      return `${cs.paddingTop}/${cs.paddingBottom}`;
    });
    const footerHeadings = [...document.querySelectorAll("footer h2, footer h3, footer h4")].map(
      (h) => `${h.tagName}:${h.innerText.trim().slice(0, 18)}`,
    );
    return {
      viewport: window.innerWidth,
      headerHeight: box(document.querySelector("header"))?.h,
      brand: box(brand),
      brandText: brandText ? { text: brandText.innerText.trim(), ...box(brandText), display: getComputedStyle(brandText).display } : null,
      brandTextOverflows: brandText ? brandText.scrollWidth > brandText.clientWidth + 1 : null,
      primaryNavVisible: nav ? getComputedStyle(nav.parentElement).display !== "none" : false,
      headerContentRight: Math.max(...[...document.querySelectorAll("header *")].map((el) => el.getBoundingClientRect().right)),
      hero: hero
        ? {
            src: hero.currentSrc.split("/").pop(),
            natural: `${hero.naturalWidth}x${hero.naturalHeight}`,
            box: box(heroBox),
            objectFit: getComputedStyle(hero).objectFit,
            objectPosition: getComputedStyle(hero).objectPosition,
            loading: hero.getAttribute("loading"),
            fetchPriority: hero.getAttribute("fetchpriority"),
          }
        : null,
      sectionPadding: sections,
      docScrollWidth: document.documentElement.scrollWidth,
      footerHeadings,
    };
  });

for (const width of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  for (const route of ["/", "/collections", "/products/classic-gold-ring-demo"]) {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 45000 });
    await page.waitForTimeout(400);
    const d = await describe(page);
    console.log(`\n=== ${route} @${width}px ===`);
    console.log(JSON.stringify(d, null, 1));
  }
  await ctx.close();
}

await browser.close();
