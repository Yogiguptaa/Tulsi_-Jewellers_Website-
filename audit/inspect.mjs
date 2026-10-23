/**
 * audit/inspect.mjs — precise axe detail for a handful of representative views.
 * Prints the full selector + outerHTML of each violating node.
 * Usage: node audit/inspect.mjs [baseUrl]
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:3210").replace(/\/$/, "");
const axe = fs.readFileSync(path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");

const TARGETS = [
  ["/", 1440],
  ["/", 390],
  ["/collections/gold-jewellery", 1440],
  ["/products/classic-gold-ring-demo", 390],
  ["/rates", 390],
  ["/gems", 390],
  ["/admin/login", 1440],
  ["/products/does-not-exist", 1440],
];

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});

for (const [route, width] of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(600);
  await page.addScriptTag({ content: axe });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      resultTypes: ["violations"],
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 4).map((n) => ({
        target: n.target,
        html: (n.html ?? "").slice(0, 420),
        summary: (n.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 300),
      })),
    }));
  });
  console.log(`\n${"=".repeat(90)}\n${width}px  ${route}  —  ${res.length} rules`);
  for (const v of res) {
    console.log(`\n  ▸ ${v.id} (${v.impact})`);
    for (const n of v.nodes) {
      console.log(`    target: ${typeof n.target === "string" ? n.target : n.target.join(" ")}`);
      console.log(`    html  : ${n.html}`);
      console.log(`    why   : ${n.summary}\n`);
    }
  }
  await ctx.close();
}

await browser.close();
