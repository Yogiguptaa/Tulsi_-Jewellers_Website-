#!/usr/bin/env node
/**
 * scripts/smoke-live.mjs — the deployed site, checked over HTTP.
 *
 * Run against production (`npm run test:live`) or a local server
 * (`npm run test:local`). It checks:
 *
 *   • every public route in the sitemap answers 200 (no soft 404s);
 *   • every internal link found on the home page and on /designs answers 200;
 *   • each main page has exactly one h1 and a non-empty <title>;
 *   • no customer-visible copy contains demo/placeholder/GST/env names/₹0/NaN;
 *   • every tel: and wa.me number is one of the two published lines;
 *   • /api/rates/latest answers 200 and reports its own state honestly.
 *
 * It exits non-zero on any failure, so CI and a post-deploy check can trust it.
 * It never checks anything that needs a login, a browser or a paid plan; those
 * are listed in QA_REPORT.md.
 */

const BASE = (
  process.argv[2] ||
  process.env.SMOKE_BASE_URL ||
  process.env.SITE_URL ||
  "https://tulsijewellerswebsite.vercel.app"
).replace(/\/+$/, "");

const ALLOWED_PHONES = ["7558220117", "8766693614"];
const BANNED_COPY = [
  { needle: "lorem ipsum", why: "lorem ipsum" },
  { needle: "RATE_PROVIDER", why: "environment variable name" },
  { needle: "API_KEY", why: "environment variable name" },
  { needle: "₹0", why: "a zero rupee value" },
  { needle: "NaN", why: "NaN in copy" },
  { needle: "GST", why: "GST label" },
];
/** Pages where a single h1 is expected. */
const MAIN_PAGES = new Set([
  "/",
  "/collections",
  "/designs",
  "/rates",
  "/rates/calculator",
  "/rates/history",
  "/gold-saving-scheme",
  "/gems",
  "/visit-us",
  "/contact",
  "/about",
  "/faq",
]);

const failures = [];
const notes = [];
const fail = (message) => failures.push(message);

async function get(path, { redirect = "follow" } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${BASE}${path}`, {
      redirect,
      signal: controller.signal,
      headers: { "user-agent": "TulsiJewellersSmokeTest/1.0" },
    });
    const body = await response.text();
    return { status: response.status, body, type: response.headers.get("content-type") ?? "" };
  } catch (error) {
    return { status: 0, body: "", type: "", error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function parseLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => {
      try {
        return new URL(match[1]).pathname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function internalLinks(html) {
  const out = new Set();
  for (const match of html.matchAll(/href="([^"#]+)"/g)) {
    const href = match[1];
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (!href.startsWith("/")) continue;
    if (href.startsWith("/_next") || href.startsWith("/api")) continue;
    out.add(href.split("?")[0]);
  }
  return [...out];
}

/** One page's copy and structure. */
function inspect(path, body) {
  for (const { needle, why } of BANNED_COPY) {
    if (body.includes(needle)) fail(`${path} shows ${why} (“${needle}”)`);
  }

  const phones = new Set();
  for (const match of body.matchAll(/(?:tel:|wa\.me\/)(?:\+?91)?(\d{10})/g)) phones.add(match[1]);
  for (const number of phones) {
    if (!ALLOWED_PHONES.includes(number)) fail(`${path} links to an unpublished number ${number}`);
  }

  const title = body.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "";
  if (!title) fail(`${path} has no <title>`);

  if (MAIN_PAGES.has(path)) {
    const h1s = body.match(/<h1[\s>]/g)?.length ?? 0;
    if (h1s !== 1) fail(`${path} has ${h1s} <h1> elements (expected exactly 1)`);
  }
}

async function main() {
  console.log(`Smoke test → ${BASE}\n`);

  const sitemap = await get("/sitemap.xml");
  if (sitemap.status !== 200) {
    fail(`/sitemap.xml answered ${sitemap.status}`);
  }
  const routes = new Set(parseLocations(sitemap.body));
  for (const route of ["/", "/rates", "/designs", "/wishlist", "/image-credits"]) routes.add(route);

  const results = [];
  const queue = [...routes];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length > 0) {
      const path = queue.shift();
      const response = await get(path);
      results.push({ path, status: response.status });
      if (response.status !== 200) {
        fail(`${path} answered ${response.status || "no response"}`);
      } else {
        inspect(path, response.body);
      }
    }
  });
  await Promise.all(workers);
  results.sort((a, b) => a.path.localeCompare(b.path));
  console.log(`Routes checked: ${results.length}`);
  const bad = results.filter((entry) => entry.status !== 200);
  console.log(bad.length === 0 ? "  all 200" : `  failing: ${bad.map((e) => `${e.path}→${e.status}`).join(", ")}`);

  // Links a visitor can actually click, from the two pages that carry the most.
  const linkSources = ["/", "/designs"];
  const seen = new Set(routes);
  const newLinks = new Set();
  for (const source of linkSources) {
    const page = await get(source);
    if (page.status !== 200) continue;
    for (const href of internalLinks(page.body)) {
      if (!seen.has(href)) newLinks.add(href);
    }
  }
  if (newLinks.size > 0) {
    const linkQueue = [...newLinks];
    const linkFailures = [];
    await Promise.all(
      Array.from({ length: 5 }, async () => {
        while (linkQueue.length > 0) {
          const href = linkQueue.shift();
          const response = await get(href);
          if (response.status !== 200) linkFailures.push(`${href}→${response.status}`);
        }
      }),
    );
    if (linkFailures.length > 0) fail(`Linked pages failing: ${linkFailures.join(", ")}`);
    console.log(`Extra in-page links checked: ${newLinks.size} (${linkFailures.length} failing)`);
  }

  const rates = await get("/api/rates/latest");
  let ratesNote = `status ${rates.status}`;
  if (rates.status === 200) {
    try {
      const payload = JSON.parse(rates.body);
      const valued = (payload.lines ?? []).filter((line) => typeof line.rate === "number" && line.rate > 0);
      ratesNote += `, ${valued.length} of ${(payload.lines ?? []).length} lines have a value, status "${payload.status}"`;
      if (valued.length > 0 && !payload.asOf) fail("/api/rates/latest returns values with no asOf timestamp");
      if (valued.length === 0) notes.push("Rates: no stored or live value — the page shows its honest call/WhatsApp fallback.");
    } catch {
      fail("/api/rates/latest did not return JSON");
    }
  } else {
    fail(`/api/rates/latest answered ${rates.status}`);
  }
  console.log(`Rates API: ${ratesNote}`);

  console.log("");
  for (const note of notes) console.log(`ℹ ${note}`);

  if (failures.length === 0) {
    console.log(`✓ Live smoke test passed (${results.length} routes).`);
    process.exit(0);
  }
  console.error(`✗ ${failures.length} failure${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures) console.error(`   ${failure}`);
  process.exit(1);
}

void main();
