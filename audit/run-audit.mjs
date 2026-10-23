/**
 * audit/run-audit.mjs — full-site visual + technical audit harness.
 *
 * Screenshots every route at 390px (mobile) and 1440px (desktop), then collects:
 *   • console messages (all levels) and uncaught page errors
 *   • failed requests and >=400 responses
 *   • axe-core accessibility violations (axe-core read from node_modules)
 *   • image weight / natural-vs-displayed size / distortion / lazy-loading
 *   • layout shift (CLS) via PerformanceObserver
 *   • horizontal overflow, undersized tap targets
 *   • leftover placeholder text visible in rendered copy
 *   • heading outline and typography metrics, for consistency checks
 *   • every link on the page (checked afterwards, once per unique URL)
 *
 * Usage:  node audit/run-audit.mjs [baseUrl] [--only=/rates,/gems] [--widths=mobile]
 *   --only     comma-separated pathnames to audit (default: the whole sitemap)
 *   --widths   comma-separated widths to run (default: mobile,desktop)
 * Requires: node_modules/playwright-core and a local Chrome/Edge install.
 */

import { chromium } from "playwright-core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ARGS = process.argv.slice(2);
const flag = (name) => {
  const hit = ARGS.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (ARGS.find((a) => !a.startsWith("--")) ?? "http://localhost:3210").replace(/\/$/, "");
const ONLY = flag("only")
  ? flag("only").split(",").map((p) => p.trim()).filter(Boolean)
  : null;
const WIDTH_FILTER = flag("widths") ? flag("widths").split(",").map((w) => w.trim()) : null;
const OUT = path.join(process.cwd(), "audit");
const SHOTS = path.join(OUT, "screenshots");

const ALL_WIDTHS = [
  { name: "mobile", width: 390, height: 844, dpr: 2, mobile: true },
  { name: "desktop", width: 1440, height: 900, dpr: 1, mobile: false },
];
const WIDTHS = WIDTH_FILTER
  ? ALL_WIDTHS.filter((w) => WIDTH_FILTER.includes(w.name))
  : ALL_WIDTHS;

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const PLACEHOLDER_PATTERNS = [
  ["TO BE CONFIRMED", /to be confirmed/i],
  ["NOT PUBLISHED", /not published/i],
  ["owner input", /owner input required/i],
  ["lorem", /lorem ipsum/i],
  ["SAMPLE TEXT", /sample text/i],
  ["TBD", /\bTBD\b/],
  ["TODO", /\bTODO\b/],
  ["FIXME", /\bFIXME\b/],
  ["bracketed placeholder", /\[(insert|customer name|name|your |xxx)/i],
  ["XXX", /\bXXX+\b/],
  ["placeholder word", /\bplaceholder\b/i],
  ["coming soon", /coming soon/i],
  ["dummy", /\bdummy\b/i],
  ["foo/bar", /\b(foo|bar baz)\b/],
];

const slugify = (url) => {
  const u = new URL(url);
  const p = u.pathname === "/" ? "home" : u.pathname.replace(/^\//, "").replace(/\/$/, "");
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 6);
  return `${p.replace(/[^a-z0-9]+/gi, "-")}-${hash}`;
};

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

function findBrowser() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  fail("No Chrome/Edge binary found. Install one or set CHROME_PATH.");
}

/** Warm every route so Turbopack has compiled it before we measure/screenshot. */
async function warm(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      await res.arrayBuffer();
      process.stdout.write(res.status >= 400 ? "!" : ".");
    } catch {
      process.stdout.write("x");
    }
  }
  process.stdout.write("\n");
}

const axeSource = fs.readFileSync(
  path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  "utf8",
);

const IN_PAGE_HELPERS = `
window.__cls = 0;
window.__shifts = [];
try {
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.hadRecentInput) {
        window.__cls += e.value;
        window.__shifts.push({ value: Number(e.value.toFixed(5)), t: Math.round(e.startTime) });
      }
    }
  }).observe({ type: "layout-shift", buffered: true });
} catch {}
window.__lcp = 0;
try {
  new PerformanceObserver((list) => {
    const es = list.getEntries();
    window.__lcp = Math.round(es[es.length - 1].startTime);
  }).observe({ type: "largest-contentful-paint", buffered: true });
} catch {}
`;

async function auditPage(browser, route, viewport, links) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dpr,
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    reducedMotion: "no-preference",
    userAgent: viewport.mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  const page = await context.newPage();
  const consoleMsgs = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];
  const imageResponses = [];
  let navStatus = null;
  let navError = null;

  page.on("console", (m) => {
    const t = m.type();
    if (t === "debug" || t === "log" || t === "info") return; // noisy in dev
    consoleMsgs.push({ type: t, text: m.text().slice(0, 500), location: m.location()?.url ?? "" });
  });
  page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 500)));
  page.on("requestfailed", (r) => {
    const f = r.failure();
    failedRequests.push({ url: r.url(), method: r.method(), error: f?.errorText ?? "unknown" });
  });
  page.on("response", async (r) => {
    const status = r.status();
    if (status >= 400) badResponses.push({ url: r.url(), status });
    const type = r.request().resourceType();
    if (type === "image") {
      const h = await r.allHeaders().catch(() => ({}));
      imageResponses.push({
        url: r.url(),
        status,
        contentType: h["content-type"] ?? "",
        bytes: Number(h["content-length"] ?? 0),
      });
    }
  });

  await page.addInitScript(IN_PAGE_HELPERS);

  try {
    const res = await page.goto(route, { waitUntil: "load", timeout: 45000 });
    navStatus = res ? res.status() : null;
  } catch (e) {
    navError = String(e.message).slice(0, 300);
  }

  await page.waitForTimeout(700);

  // Walk the page so scroll-triggered reveal animations actually fire.
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    const max = document.body.scrollHeight;
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
  // Lazy photographs that entered the viewport on the walk are still in flight
  // here. Measuring now reports them as "broken" (naturalWidth 0) when they are
  // only late, so give every image a bounded chance to finish first.
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, {
      timeout: 10000,
    })
    .catch(() => {});
  await page.waitForTimeout(500);

  const data = await page.evaluate(
    ({ placeholderSource }) => {
      const patterns = placeholderSource.map(([label, src]) => [label, new RegExp(src, "i")]);
      const vis = (el) => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0)
          return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      // ---- images -------------------------------------------------------
      const images = [];
      for (const img of Array.from(document.querySelectorAll("img"))) {
        const r = img.getBoundingClientRect();
        images.push({
          src: img.currentSrc || img.getAttribute("src") || "",
          alt: img.getAttribute("alt"),
          altMissing: img.getAttribute("alt") === null,
          emptyAlt: img.getAttribute("alt") === "",
          natural: `${img.naturalWidth}x${img.naturalHeight}`,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          displayed: `${Math.round(r.width)}x${Math.round(r.height)}`,
          renderedW: Math.round(r.width),
          renderedH: Math.round(r.height),
          belowFoldOnly: r.top > window.innerHeight,
          hasDims: img.hasAttribute("width") && img.hasAttribute("height"),
          lazy: img.getAttribute("loading"),
          decoding: img.getAttribute("decoding"),
          sizes: img.getAttribute("sizes"),
          srcset: Boolean(img.getAttribute("srcset")),
          complete: img.complete,
          objectFit: getComputedStyle(img).objectFit,
          /** complete + zero natural size = the file really failed to load. */
          broken: img.complete && img.naturalWidth === 0,
          visible: vis(img),
        });
      }
      const bgImages = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none" && bg.includes("url(")) {
          bgImages.push({ bg: bg.slice(0, 200), tag: el.tagName, cls: String(el.className).slice(0, 120) });
        }
      }

      // ---- placeholder copy --------------------------------------------
      const bodyText = document.body.innerText || "";
      const placeholders = [];
      for (const [label, re] of patterns) {
        const m = bodyText.match(re);
        if (m) {
          const i = Math.max(0, (m.index ?? 0) - 60);
          placeholders.push({ label, match: m[0], context: bodyText.slice(i, i + 140).replace(/\s+/g, " ") });
        }
      }

      // ---- links --------------------------------------------------------
      const pageLinks = [];
      for (const a of Array.from(document.querySelectorAll("a"))) {
        const href = a.getAttribute("href");
        if (href === null) continue;
        const text = (a.innerText || a.getAttribute("aria-label") || "").trim();
        const r = a.getBoundingClientRect();
        pageLinks.push({
          href,
          text: text.slice(0, 80),
          noText: text.length === 0 && !a.querySelector("img[alt]:not([alt=''])"),
          blank: a.getAttribute("target") === "_blank",
          rel: a.getAttribute("rel") ?? "",
          size: `${Math.round(r.width)}x${Math.round(r.height)}`,
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }

      // ---- tap targets --------------------------------------------------
      const smallTargets = [];
      for (const el of Array.from(
        document.querySelectorAll("a, button, [role='button'], input, select, textarea, summary"),
      )) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 24 || r.width < 24) {
          smallTargets.push({
            tag: el.tagName,
            text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("type") || "").trim().slice(0, 60),
            size: `${Math.round(r.width)}x${Math.round(r.height)}`,
          });
        }
      }

      // ---- headings + typography ---------------------------------------
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => {
        const cs = getComputedStyle(h);
        return {
          level: Number(h.tagName[1]),
          text: (h.innerText || "").trim().slice(0, 60),
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          fontWeight: cs.fontWeight,
          letterSpacing: cs.letterSpacing,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
          visible: vis(h),
        };
      });

      const sections = Array.from(document.querySelectorAll("section")).map((s) => {
        const cs = getComputedStyle(s);
        return {
          cls: String(s.className).slice(0, 90),
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          gap: cs.gap,
          maxWidth: cs.maxWidth,
        };
      });

      const containers = Array.from(document.querySelectorAll("[class*='container']")).map((el) => {
        const cs = getComputedStyle(el);
        return {
          cls: String(el.className).slice(0, 90),
          maxWidth: cs.maxWidth,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          width: Math.round(el.getBoundingClientRect().width),
        };
      });

      // ---- layout sanity -------------------------------------------------
      const de = document.documentElement;
      const overflow = Math.max(0, de.scrollWidth - window.innerWidth);
      const overflowers = [];
      if (overflow > 1) {
        for (const el of Array.from(document.querySelectorAll("*"))) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1) {
            overflowers.push({
              tag: el.tagName,
              cls: String(el.className).slice(0, 90),
              text: (el.innerText || "").trim().slice(0, 50),
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
          }
        }
      }

      // Content that never became visible (stuck reveal animations).
      const stuck = [];
      for (const el of Array.from(document.querySelectorAll("main *"))) {
        const cs = getComputedStyle(el);
        const txt = (el.innerText || "").trim();
        if (!txt || txt.length < 4) continue;
        const r = el.getBoundingClientRect();
        if (r.height === 0 && cs.opacity === "0") {
          stuck.push({ tag: el.tagName, cls: String(el.className).slice(0, 70), text: txt.slice(0, 50) });
        }
      }

      return {
        title: document.title,
        lang: document.documentElement.lang,
        metaDescription: document.querySelector("meta[name='description']")?.getAttribute("content") ?? null,
        canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") ?? null,
        ogImage: document.querySelector("meta[property='og:image']")?.getAttribute("content") ?? null,
        images,
        bgImages,
        placeholders,
        pageLinks,
        smallTargets,
        headings,
        sections,
        containers,
        overflow,
        overflowers: overflowers.slice(0, 25),
        stuck: stuck.slice(0, 25),
        docHeight: de.scrollHeight,
        bodyChars: bodyText.length,
        cls: Number(window.__cls.toFixed(4)),
        clsShifts: window.__shifts.slice(0, 12),
        lcp: window.__lcp,
        perf: (() => {
          const res = performance.getEntriesByType("resource");
          const byType = {};
          let total = 0;
          for (const r of res) {
            const t = r.initiatorType || "other";
            byType[t] = byType[t] ?? { count: 0, bytes: 0, ms: 0 };
            byType[t].count++;
            byType[t].bytes += r.transferSize || r.encodedBodySize || 0;
            byType[t].ms += r.duration || 0;
          }
          total = res.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0);
          const timings = performance.getEntriesByType("navigation")[0];
          return {
            requests: res.length,
            totalBytes: total,
            byType,
            domContentLoaded: Math.round(timings?.domContentLoadedEventEnd ?? 0),
            loadEvent: Math.round(timings?.loadEventEnd ?? 0),
            ttfb: Math.round(timings?.responseStart ?? 0),
          };
        })(),
      };
    },
    { placeholderSource: PLACEHOLDER_PATTERNS.map(([l, r]) => [l, r.source]) },
  );

  // ---- axe ---------------------------------------------------------------
  let axe = { violations: [], passes: 0, incomplete: 0 };
  try {
    await page.addScriptTag({ content: axeSource });
    const raw = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        resultTypes: ["violations", "incomplete"],
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
      });
      return {
        violations: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.slice(0, 6).map((n) => ({
            target: n.target.join(" "),
            summary: (n.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220),
          })),
        })),
        incomplete: r.incomplete.length,
      };
    });
    axe = { ...axe, ...raw, passes: 0 };
  } catch (e) {
    axe.error = String(e.message).slice(0, 200);
  }

  // ---- screenshot --------------------------------------------------------
  const file = path.join(SHOTS, viewport.name, `${slugify(route)}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
  } catch (e) {
    file.error = String(e.message).slice(0, 200);
  }

  await context.close();

  // ---- consolidate links -------------------------------------------------
  for (const l of data.pageLinks) {
    if (l.href.startsWith("#") || l.href.startsWith("mailto:") || l.href.startsWith("tel:")) continue;
    let abs;
    try {
      abs = new URL(l.href, route).toString();
    } catch {
      links.push({ from: route, href: l.href, abs: null, note: "unparseable" });
      continue;
    }
    links.push({ from: route, href: l.href, abs, text: l.text, noText: l.noText, blank: l.blank, rel: l.rel });
  }

  return {
    route,
    width: viewport.name,
    navStatus,
    navError,
    screenshot: path.relative(process.cwd(), file).replace(/\\/g, "/"),
    console: consoleMsgs,
    pageErrors,
    failedRequests,
    badResponses,
    imageResponses,
    axe,
    ...data,
  };
}

// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });

  const extra = [
    "/wishlist",
    "/image-credits",
    "/admin/login",
    "/admin",
    "/this-page-does-not-exist-audit",
    "/products/this-product-does-not-exist-audit",
  ];

  const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text());
  const routes = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1])
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return u;
      }
    })
    .filter((p, i, a) => a.indexOf(p) === i);

  let selected = [...routes, ...extra].filter((p, i, a) => a.indexOf(p) === i);
  if (ONLY) selected = selected.filter((p) => ONLY.some((o) => p === o || (o !== "/" && p.startsWith(o))));
  if (!selected.length) fail(`--only matched no route. Available: ${routes.slice(0, 8).join(", ")}…`);

  const all = selected.map((p) => (p === "/" ? `${BASE}/` : `${BASE}${p}`));
  console.log(`Auditing ${all.length} routes × ${WIDTHS.length} widths = ${all.length * WIDTHS.length} views`);
  console.log(`Base: ${BASE}\nWarming cache (compiling every route in dev)…`);
  await warm(all);

  const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  const links = [];
  const pages = [];
  let n = 0;
  for (const viewport of WIDTHS) {
    for (const route of all) {
      n++;
      const short = route.replace(BASE, "") || "/";
      process.stdout.write(`[${String(n).padStart(3)}/${all.length * WIDTHS.length}] ${viewport.name.padEnd(7)} ${short}\n`);
      try {
        pages.push(await auditPage(browser, route, viewport, links));
      } catch (e) {
        pages.push({ route, width: viewport.name, hardError: String(e.message).slice(0, 300) });
      }
    }
  }
  await browser.close();

  // ---- link check (unique targets) ---------------------------------------
  const unique = Array.from(new Set(links.map((l) => l.abs).filter(Boolean)));
  console.log(`\nChecking ${unique.length} unique link targets…`);
  const linkCheck = {};
  for (const u of unique) {
    try {
      const res = await fetch(u, { redirect: "manual" });
      linkCheck[u] = { status: res.status, location: res.headers.get("location") ?? null };
    } catch (e) {
      linkCheck[u] = { status: 0, error: String(e.message).slice(0, 120) };
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    routeCount: all.length,
    viewCount: pages.length,
    pages,
    links,
    linkCheck,
  };
  const reportFile = ONLY || WIDTH_FILTER ? "report.focus.json" : "report.json";
  fs.writeFileSync(path.join(OUT, reportFile), JSON.stringify(report, null, 2));
  console.log(`\nWrote audit/${reportFile} (${pages.length} views, ${unique.length} links)`);
}

main().catch((e) => fail(String(e.stack ?? e)));
