/**
 * audit/summarize.mjs — turns an audit report into a readable summary.
 * Usage: node audit/summarize.mjs [report.focus.json]
 * A focused run writes report.focus.json + summary.focus.md so it never
 * overwrites the full-site artefacts.
 */
import fs from "node:fs";
import path from "node:path";

const reportFile = process.argv[2] ?? "report.json";
const focused = reportFile !== "report.json";
const summaryFile = focused ? "summary.focus.md" : "summary.md";
const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), "audit", reportFile), "utf8"));
const { pages, linkCheck } = report;

const short = (r) => (r.replace(report.baseUrl, "") || "/");
const key = (p) => `${p.width} ${short(p.route)}`;

const lines = [];
const out = (s = "") => {
  lines.push(s);
};
const section = (t) => {
  out();
  out(`## ${t}`);
  out();
};

/* ------------------------------------------------------------------ 1. errors */
section("Console + runtime errors");
const byMsg = new Map();
for (const p of pages) {
  for (const c of p.console ?? []) {
    const k = `${c.type} :: ${c.text.slice(0, 160)}`;
    if (!byMsg.has(k)) byMsg.set(k, { type: c.type, text: c.text, loc: c.location, views: [] });
    byMsg.get(k).views.push(key(p));
  }
  for (const e of p.pageErrors ?? []) {
    const k = `pageerror :: ${e.slice(0, 160)}`;
    if (!byMsg.has(k)) byMsg.set(k, { type: "pageerror", text: e, loc: "", views: [] });
    byMsg.get(k).views.push(key(p));
  }
}
if (byMsg.size === 0) out("None.");
for (const [, v] of [...byMsg.entries()].sort((a, b) => b[1].views.length - a[1].views.length)) {
  out(`- **${v.type}** \`${v.text.slice(0, 300)}\``);
  out(`  - ${v.views.length} views, e.g. ${v.views.slice(0, 3).join(" | ")}`);
}

section("Failed requests / >=400 responses");
const badReq = new Map();
for (const p of pages) {
  for (const r of p.failedRequests ?? []) {
    const k = `FAIL ${r.error} ${r.url.replace(report.baseUrl, "")}`;
    badReq.set(k, (badReq.get(k) ?? 0) + 1);
  }
  for (const r of p.badResponses ?? []) {
    const k = `HTTP ${r.status} ${r.url.replace(report.baseUrl, "")}`;
    badReq.set(k, (badReq.get(k) ?? 0) + 1);
  }
}
if (badReq.size === 0) out("None.");
for (const [k, n] of [...badReq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)) out(`- ${k} — ${n}×`);
if (badReq.size > 40) out(`- …${badReq.size - 40} more`);

/* --------------------------------------------------------------- 2. linkcheck */
section("Link check (rendered links)");
const broken = Object.entries(linkCheck).filter(([, v]) => v.status === 0 || v.status >= 400);
if (!broken.length) out(`All ${Object.keys(linkCheck).length} unique targets returned < 400.`);
for (const [u, v] of broken) {
  const froms = [...new Set(pages.flatMap((p) => (p.links ?? []).filter((l) => l.abs === u).map((l) => short(p.route))))];
  out(`- ${v.status || "ERR"} ${u.replace(report.baseUrl, "")}${v.error ? ` (${v.error})` : ""} ← from ${froms.slice(0, 4).join(", ")}`);
}
const redirects = Object.entries(linkCheck).filter(([, v]) => v.location);
for (const [u, v] of redirects) out(`- ↪ ${u.replace(report.baseUrl, "")} → ${v.location}`);

/* --------------------------------------------------------------- 3. all links */
section("Link hygiene");
const allLinks = pages.flatMap((p) => (p.links ?? []).map((l) => ({ ...l, route: short(p.route) })));
const noText = allLinks.filter((l) => l.noText);
const uniqNoText = [...new Set(noText.map((l) => `${l.href} @${l.route}`))];
out(`- links with no accessible text: ${noText.length}${uniqNoText.length ? ` → ${uniqNoText.slice(0, 8).join(", ")}` : ""}`);
const blankNoRel = allLinks.filter((l) => l.blank && !/noopener/.test(l.rel));
out(`- target=_blank without rel=noopener: ${blankNoRel.length}`);
const hashOnly = allLinks.filter((l) => l.href === "#");
out(`- href=\"#\" dead anchors: ${hashOnly.length}${hashOnly.length ? ` → ${[...new Set(hashOnly.map((l) => l.route))].slice(0, 6).join(", ")}` : ""}`);

/* ------------------------------------------------------------------- 4. axe */
section("Accessibility (axe-core)");
const axeMap = new Map();
for (const p of pages) {
  for (const v of p.axe?.violations ?? []) {
    if (!axeMap.has(v.id)) axeMap.set(v.id, { impact: v.impact, help: v.help, views: new Set(), nodes: new Map() });
    const e = axeMap.get(v.id);
    e.views.add(key(p));
    for (const n of v.nodes) e.nodes.set(n.target, n.summary);
  }
}
if (!axeMap.size) out("No violations.");
for (const [id, v] of [...axeMap.entries()].sort((a, b) => b[1].views.size - a[1].views.size)) {
  out(`- **${id}** (${v.impact}) ${v.help}`);
  out(`  - ${v.views.size} views: ${[...v.views].slice(0, 6).join(" | ")}`);
  for (const [t, s] of [...v.nodes.entries()].slice(0, 3)) out(`  - \`${t}\` — ${s.slice(0, 180)}`);
}

/* ------------------------------------------------------------- 5. placeholders */
section("Placeholder text in rendered copy");
const phMap = new Map();
for (const p of pages) {
  for (const ph of p.placeholders ?? []) {
    const k = `${ph.label} :: ${ph.match}`;
    if (!phMap.has(k)) phMap.set(k, { ...ph, views: [] });
    phMap.get(k).views.push(key(p));
  }
}
if (!phMap.size) out("None.");
for (const [, v] of phMap) out(`- **${v.label}** “${v.match}” — ${v.views.length} views: ${v.views.slice(0, 4).join(" | ")}\n  - …${v.context.slice(0, 160)}`);

/* --------------------------------------------------------------- 6. layout */
section("Horizontal overflow");
const ov = pages.filter((p) => (p.overflow ?? 0) > 1);
if (!ov.length) out("None — no page scrolls sideways.");
for (const p of ov) {
  out(`- ${key(p)}: ${p.overflow}px (viewport ${p.width === "mobile" ? 390 : 1440})`);
  for (const o of (p.overflowers ?? []).slice(0, 5)) out(`  - \`${o.tag}.${o.cls}\` right=${o.right} w=${o.width} “${o.text}”`);
}

section("Stuck / never-revealed content");
const stuck = pages.filter((p) => (p.stuck ?? []).length);
if (!stuck.length) out("None.");
for (const p of stuck) out(`- ${key(p)}: ${p.stuck.map((s) => `${s.tag}(${s.text.slice(0, 24)})`).join(", ")}`);

/* ----------------------------------------------------------------- 7. images */
section("Images");
const imgRows = new Map();
for (const p of pages) {
  for (const img of p.images ?? []) {
    const src = img.src.replace(report.baseUrl, "");
    const resp = (p.imageResponses ?? []).find((r) => r.url === img.src);
    const k = src;
    if (!imgRows.has(k)) imgRows.set(k, { src, bytes: resp?.bytes ?? 0, ct: resp?.contentType ?? "?", naturalW: img.naturalW, naturalH: img.naturalH, altMissing: img.altMissing, emptyAlt: img.emptyAlt, lazy: img.lazy, hasDims: img.hasDims, distorted: [], displayed: new Set(), broken: false, late: false });
    const e = imgRows.get(k);
    // Only a *finished* image with no pixels is broken. One that never finished
    // loading by the end of the run is late, not missing.
    if (img.broken ?? (img.complete && img.naturalW === 0)) e.broken = true;
    else if (!img.complete) e.late = true;
    if (img.altMissing) e.altMissing = true;
    if (img.emptyAlt) e.emptyAlt = true;
    // `object-fit: cover` crops on purpose — that is not a distorted photo, so
    // only a `fill`/`contain` box whose ratio differs from the file counts.
    const crops = img.objectFit === "cover" || img.objectFit === "contain";
    if (!crops && img.renderedW && img.naturalW && img.renderedW > 0) {
      const dispRatio = img.renderedW / Math.max(1, img.renderedH);
      const natRatio = img.naturalW / Math.max(1, img.naturalH);
      if (natRatio > 0 && Math.abs(dispRatio / natRatio - 1) > 0.06)
        e.distorted.push(`${img.displayed} on ${key(p)} (natural ${img.natural})`);
    }
    e.displayed.add(`${img.renderedW}x${img.renderedH}`);
  }
}
const imgList = [...imgRows.values()].sort((a, b) => b.bytes - a.bytes);
out(`- distinct image URLs: ${imgList.length}`);
out(`- html alt attribute missing: ${imgList.filter((i) => i.altMissing).length}; empty alt: ${imgList.filter((i) => i.emptyAlt).length}`);
out(`- broken (file failed to load): ${imgList.filter((i) => i.broken).length}${imgList.filter((i) => i.broken).map((i) => ` → ${i.src}`).join("")}`);
out(`- still loading at measure time: ${imgList.filter((i) => i.late).length}`);
out(`- no width/height attrs (CLS risk): ${imgList.filter((i) => !i.hasDims).length}`);
out(`- lazy: ${imgList.filter((i) => i.lazy === "lazy").length}, eager/missing: ${imgList.filter((i) => i.lazy !== "lazy").length}`);
out(`- distorted (natural vs displayed ratio differs >6%): ${imgList.filter((i) => i.distorted.length).length}`);
for (const i of imgList.filter((i) => i.distorted.length).slice(0, 10)) out(`  - ${i.src} — ${i.distorted[0]}`);
out("");
out("### Heaviest images");
for (const i of imgList.slice(0, 20)) {
  out(`- ${(i.bytes / 1024).toFixed(0)}KB ${i.ct} ${i.naturalW}x${i.naturalH} displayed ${[...i.displayed].join("/")} ${i.src}`);
}
const heavyUndersized = imgList.filter((i) => i.bytes > 300_000 && i.naturalW > 1200);
out("");
out(`### Large files rendered small (>300KB and natural width >1200px): ${heavyUndersized.length}`);
for (const i of heavyUndersized.slice(0, 15)) out(`- ${(i.bytes / 1024).toFixed(0)}KB ${i.naturalW}px → shown ${[...i.displayed].join("/")} — ${i.src}`);

/* -------------------------------------------------------------------- 8. cls */
section("Cumulative layout shift");
const clsRows = pages.filter((p) => (p.cls ?? 0) > 0.01).sort((a, b) => b.cls - a.cls);
if (!clsRows.length) out("All views at or below 0.01.");
for (const p of clsRows.slice(0, 25)) out(`- ${key(p)}: CLS ${p.cls} (lcp ${p.lcp}ms) shifts ${JSON.stringify((p.clsShifts ?? []).slice(0, 4))}`);

section("LCP / page weight (dev server — indicative only)");
const perf = pages
  .map((p) => ({ k: key(p), lcp: p.lcp, bytes: p.perf?.totalBytes ?? 0, req: p.perf?.requests ?? 0, ttfb: p.perf?.ttfb ?? 0, load: p.perf?.loadEvent ?? 0 }))
  .sort((a, b) => b.bytes - a.bytes);
for (const p of perf.slice(0, 12)) out(`- ${p.k}: ${(p.bytes / 1024 / 1024).toFixed(2)}MB, ${p.req} reqs, LCP ${p.lcp}ms, load ${p.load}ms, TTFB ${p.ttfb}ms`);

/* ------------------------------------------------------------------ 9. tap */
section("Undersized tap targets (mobile, <24px)");
const t = pages.filter((p) => p.width === "mobile").flatMap((p) => (p.smallTargets ?? []).map((s) => ({ ...s, route: short(p.route) })));
const tMap = new Map();
for (const s of t) tMap.set(`${s.tag}|${s.text}|${s.size}`, (tMap.get(`${s.tag}|${s.text}|${s.size}`) ?? 0) + 1);
if (!t.size) out("None.");
for (const [k, n] of [...tMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) out(`- ${k} — ${n}×`);

/* -------------------------------------------------------------- 10. headings */
section("Heading outline");
const h1Multi = pages.filter((p) => (p.headings ?? []).filter((h) => h.level === 1).length > 1);
out(`- views with more than one h1: ${h1Multi.length}${h1Multi.length ? ` → ${[...new Set(h1Multi.map(key))].slice(0, 8).join(", ")}` : ""}`);
const h1None = pages.filter((p) => (p.headings ?? []).filter((h) => h.level === 1).length === 0);
out(`- views with no h1: ${h1None.length}${h1None.length ? ` → ${[...new Set(h1None.map(key))].slice(0, 12).join(", ")}` : ""}`);
const skips = new Map();
for (const p of pages) {
  let prev = 0;
  for (const h of p.headings ?? []) {
    if (prev && h.level - prev > 1) skips.set(`${short(p.route)} :: h${prev}→h${h.level} “${h.text}”`, 1);
    prev = h.level;
  }
}
out(`- skipped heading levels: ${skips.size}`);
for (const k of [...skips.keys()].slice(0, 12)) out(`  - ${k}`);

section("Typography metric inventory");
const fontSizes = new Map();
for (const p of pages) {
  for (const h of p.headings ?? []) fontSizes.set(`h${h.level} ${h.fontSize}/${h.lineHeight} ${h.fontWeight}`, (fontSizes.get(`h${h.level} ${h.fontSize}/${h.lineHeight} ${h.fontWeight}`) ?? 0) + 1);
}
for (const [k, n] of [...fontSizes.entries()].sort()) out(`- ${k} — ${n}`);

section("Section spacing inventory (unique padding combinations)");
const pad = new Map();
for (const p of pages) {
  for (const s of p.sections ?? []) {
    const k = `${s.paddingTop} / ${s.paddingBottom}`;
    if (!pad.has(k)) pad.set(k, new Set());
    pad.get(k).add(short(p.route));
  }
}
for (const [k, set] of [...pad.entries()].sort()) out(`- ${k} — on ${[...set].slice(0, 4).join(", ")}${set.size > 4 ? ` +${set.size - 4}` : ""}`);

section("Container metrics");
const cont = new Map();
for (const p of pages) {
  for (const c of p.containers ?? []) cont.set(`${c.maxWidth} pad ${c.paddingLeft}/${c.paddingRight}`, (cont.get(`${c.maxWidth} pad ${c.paddingLeft}/${c.paddingRight}`) ?? 0) + 1);
}
for (const [k, n] of [...cont.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) out(`- ${k} — ${n}`);

section("Meta sanity");
const noTitle = pages.filter((p) => !p.title);
const noDesc = pages.filter((p) => !p.metaDescription);
const longDesc = pages.filter((p) => (p.metaDescription ?? "").length > 165);
const longTitle = pages.filter((p) => (p.title ?? "").length > 65);
const noCanon = pages.filter((p) => !p.canonical);
const noLang = pages.filter((p) => p.lang !== "en" && p.lang !== "hi");
out(`- missing title: ${noTitle.length}; missing description: ${noDesc.length}; description >165 chars: ${longDesc.length} (${[...new Set(longDesc.map(key))].slice(0, 5).join(", ")}); title >65 chars: ${longTitle.length}`);
out(`- missing canonical: ${noCanon.length} (${[...new Set(noCanon.map(key))].slice(0, 8).join(", ")})`);
out(`- unexpected lang: ${noLang.length} ${[...new Set(noLang.map((p) => p.lang))].join(",")}`);

section("Nav status anomalies");
for (const p of pages.filter((p) => p.navStatus !== 200 || p.navError)) {
  out(`- ${key(p)} → ${p.navStatus ?? "ERR"} ${p.navError ?? ""}`);
}
const hard = pages.filter((p) => p.hardError);
for (const p of hard) out(`- HARD ERROR ${key(p)}: ${p.hardError}`);

fs.mkdirSync(path.join(process.cwd(), "audit"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "audit", summaryFile), lines.join("\n"));
console.log(lines.join("\n"));
