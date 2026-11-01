#!/usr/bin/env node
/**
 * scripts/check-customer-copy.mjs
 *
 * Customer-facing copy and media guards. Four checks, each of which has caught a
 * real problem on this site at some point:
 *
 *  1. NO DEVELOPER OR DEMO LANGUAGE IN A STRING A CUSTOMER CAN SEE.
 *     demo / dummy / sample / lorem / placeholder, "GST", "benchmark", env names
 *     such as RATE_PROVIDER or API_KEY, and the literal text null / NaN /
 *     undefined / ₹0. Only string and template literals are inspected, with
 *     comments removed first, so code like `?? null` is not a false positive.
 *
 *  2. ONLY THE TWO PUBLISHED PHONE NUMBERS. Any other 10-digit Indian number in
 *     customer copy fails the check.
 *
 *  3. EVERY DESIGN PHOTOGRAPH EXISTS AND IS LICENSED FOR COMMERCIAL USE.
 *     Keys in src/lib/designs.ts must be present in public/media/manifest.json,
 *     with a licence that is not NC or ND, and alt text in both languages.
 *
 *  4. EVERY DESIGN LINKS TO A REAL GUIDE.
 *
 * Usage: node scripts/check-customer-copy.mjs      (npm run check:copy)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const problems = [];
const fail = (message) => problems.push(message);

/* -------------------------------------------------------------------------- */
/* Source walking                                                             */
/* -------------------------------------------------------------------------- */

const COPY_DIRS = [
  "src/components",
  "src/lib/i18n",
  "src/lib/content",
  "src/lib/designs.ts",
  "src/app/(site)",
];

const EXTENSIONS = [".ts", ".tsx", ".mjs"];

function walk(path, out = []) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) walk(join(path, entry), out);
    return out;
  }
  if (EXTENSIONS.some((ext) => path.endsWith(ext))) out.push(path);
  return out;
}

function files() {
  const out = [];
  for (const dir of COPY_DIRS) {
    const path = join(ROOT, dir);
    try {
      out.push(...walk(path));
    } catch {
      fail(`check-customer-copy: ${dir} is missing.`);
    }
  }
  return out;
}

/** Strip // and block comments so a note about "benchmark" is not a finding. */
function stripComments(source) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (quote) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (char === quote) quote = null;
      i += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += char;
      i += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") out += "\n";
        i += 1;
      }
      i += 2;
      continue;
    }
    out += char;
    i += 1;
  }
  return out;
}

/** Every quoted or backticked literal in a file, with its line number. */
function literals(source) {
  const found = [];
  const pattern = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/gs;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const text = match[2];
    if (text.length === 0) continue;
    const line = source.slice(0, match.index).split("\n").length;
    found.push({ text, line });
  }
  return found;
}

/* -------------------------------------------------------------------------- */
/* 1 + 2. Copy guards                                                          */
/* -------------------------------------------------------------------------- */

const BANNED = [
  { pattern: /\bdemo\b/i, why: "demo language" },
  { pattern: /\bdummy\b/i, why: "dummy data" },
  // "a sample of the metal" is ordinary English; "sample product" is not.
  { pattern: /\bsample\s+(?:data|product|products|inventory|item|items|listing|listings|price|prices|review|reviews)\b/i, why: "sample data" },
  { pattern: /\blorem\b/i, why: "lorem ipsum" },
  // Tailwind's `placeholder:` variant and the `placeholder` attribute are code.
  { pattern: /\bplaceholder\b(?![:=])/i, why: "placeholder copy", skipClassNameLooking: true },
  { pattern: /\bGST\b/, why: "GST label (not shown anywhere)" },
  { pattern: /\bbenchmark\b/i, why: "benchmark wording (use 'rate')" },
  { pattern: /\bRATE_[A-Z_]+\b/, why: "environment variable name" },
  { pattern: /\bAPI_KEY\b/, why: "environment variable name" },
  { pattern: /\$\{?undefined\}?/, why: "undefined in copy" },
  { pattern: /₹\s?0(?![\d.,])/, why: "₹0" },
  { pattern: /\bNaN\b/, why: "NaN in copy" },
];

/** Numbers allowed in customer copy: the two published lines, nothing else. */
const ALLOWED_PHONES = new Set(["7558220117", "8766693614"]);

/** Files allowed to name a technical string deliberately. */
const TECH_ALLOW = [
  // The admin UI is not customer copy; it names env vars on purpose.
  "src/components/admin/",
];

let literalCount = 0;
for (const file of files()) {
  const rel = relative(ROOT, file).split("\\").join("/");
  if (TECH_ALLOW.some((prefix) => rel.startsWith(prefix))) continue;

  const source = stripComments(readFileSync(file, "utf8"));
  for (const { text, line } of literals(source)) {
    literalCount += 1;

    for (const { pattern, why, skipClassNameLooking } of BANNED) {
      if (!pattern.test(text)) continue;
      if (skipClassNameLooking) {
        // A literal that is only a class list, an attribute name or a bare
        // identifier is not prose. Prose has spaces and ordinary words.
        const looksLikeCode =
          text === "placeholder" ||
          /placeholder[:=]/.test(text) ||
          !/\s/.test(text) ||
          /^[a-z0-9:\-/\[\]${}.%\s]+$/.test(text);
        if (looksLikeCode) continue;
      }
      fail(`${rel}:${line}  ${why} in copy: "${text.slice(0, 90)}"`);
    }
    if (/\bnull\b/.test(text) && /^\s*null\s*$/.test(text)) {
      fail(`${rel}:${line}  literal "null" in copy`);
    }

    const numbers = text.match(/(?:\+?91[\s-]?)?\b[6-9]\d{9}\b/g) ?? [];
    for (const entry of numbers) {
      const digits = entry.replace(/\D/g, "").slice(-10);
      if (!ALLOWED_PHONES.has(digits)) {
        fail(`${rel}:${line}  unpublished phone number ${entry}`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 3 + 4. Designs and media                                                    */
/* -------------------------------------------------------------------------- */

const manifest = JSON.parse(readFileSync(join(ROOT, "public/media/manifest.json"), "utf8"));
const byKey = new Map(manifest.assets.map((asset) => [asset.key, asset]));
const designsSource = readFileSync(join(ROOT, "src/lib/designs.ts"), "utf8");
const guidesSource = readFileSync(join(ROOT, "src/lib/content/guides.ts"), "utf8");

const guideSlugs = new Set([...guidesSource.matchAll(/^\s{4}slug:\s*"([^"]+)"/gm)].map((m) => m[1]));
const designSlugs = new Set();
const designBlocks = [...designsSource.matchAll(/slug: "([^"]+)"[\s\S]*?images: \[([^\]]*)\]/g)];

for (const [, slug, imageList] of designBlocks) {
  if (designSlugs.has(slug)) fail(`designs: duplicate slug "${slug}"`);
  designSlugs.add(slug);

  const guide = designsSource
    .slice(designsSource.indexOf(`slug: "${slug}"`))
    .match(/guideSlug: "([^"]+)"/)?.[1];
  if (!guide || !guideSlugs.has(guide)) {
    fail(`designs: "${slug}" links to unknown guide "${guide ?? "(none)"}"`);
  }

  const keys = [...imageList.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const key of keys) {
    const asset = byKey.get(key);
    if (!asset) {
      fail(`designs: "${slug}" uses image "${key}", which is not in the media manifest`);
      continue;
    }
    const licence = `${asset.credit?.license ?? ""}`;
    if (!licence) {
      fail(`designs: image "${key}" has no licence recorded`);
    } else if (/\b(NC|ND)\b|non-?commercial|no-?deriv/i.test(licence)) {
      fail(`designs: image "${key}" is licensed "${licence}" — not usable commercially`);
    }
    for (const lang of ["en", "hi"]) {
      if (!asset.alt?.[lang]?.trim()) fail(`designs: image "${key}" has no ${lang} alt text`);
    }
  }
}

if (designSlugs.size === 0) fail("designs: no styles found in src/lib/designs.ts");

/* -------------------------------------------------------------------------- */

if (problems.length === 0) {
  console.log(
    `✓ Copy and media guards passed (${literalCount} strings checked, ${designSlugs.size} design styles, ${manifest.assets.length} media assets).`,
  );
  process.exit(0);
}

console.error(`✗ ${problems.length} copy/media problem${problems.length === 1 ? "" : "s"}:`);
for (const problem of problems) console.error(`   ${problem}`);
process.exit(1);
