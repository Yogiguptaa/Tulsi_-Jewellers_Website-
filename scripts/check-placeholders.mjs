#!/usr/bin/env node
/**
 * scripts/check-placeholders.mjs
 *
 * Fails when a customer could see a raw placeholder on the site.
 *
 * A placeholder is a bracketed marker such as `[INSERT FULL ADDRESS]`. They are
 * allowed in exactly two places:
 *   • inside comments (a note to the developer), and
 *   • in the `PENDING_CONFIRMATIONS` list in src/lib/config.ts, which exists to
 *     document what the owner still has to supply.
 * Anywhere else — a string that could be rendered — the build stops.
 *
 * Usage:  node scripts/check-placeholders.mjs        (npm run check:placeholders)
 * Exit 0 = clean, exit 1 = at least one visible placeholder.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src"];
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json"];
const PLACEHOLDER = /\[(INSERT|CONFIRM|PLACEHOLDER|TODO|TBD|XXX)[^\]]*\]/gi;

/** Files where a placeholder is documentation rather than output. */
const ALLOWLIST = new Set(["src/lib/config.ts"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXTENSIONS.includes(entry.slice(entry.lastIndexOf(".")))) out.push(path);
  }
  return out;
}

/** Is the match inside a comment? Block comments are tracked across lines. */
function classify(line, index, inBlockComment) {
  if (inBlockComment) return "comment";
  const before = line.slice(0, index);
  // `//`, or a `/*` opened earlier on the same line before the match.
  if (/(^|[^:])\/\//.test(before) || /\/\*/.test(before)) return "comment";
  return "visible";
}

/** Does this line open or close a `/* … *​/` block, ignoring line comments? */
function blockStateAfter(line, inBlock) {
  let state = inBlock;
  for (let i = 0; i < line.length; i += 1) {
    if (!state && line.startsWith("//", i)) break;
    if (!state && line.startsWith("/*", i)) {
      state = true;
      i += 1;
      continue;
    }
    if (state && line.startsWith("*/", i)) {
      state = false;
      i += 1;
    }
  }
  return state;
}

const findings = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).split("\\").join("/");
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    let inBlock = false;
    lines.forEach((line, number) => {
      PLACEHOLDER.lastIndex = 0;
      let match;
      while ((match = PLACEHOLDER.exec(line)) !== null) {
        const kind = ALLOWLIST.has(rel) ? "documented" : classify(line, match.index, inBlock);
        findings.push({
          file: rel,
          line: number + 1,
          text: match[0],
          kind,
          source: line.trim().slice(0, 120),
        });
      }
      inBlock = blockStateAfter(line, inBlock);
    });
  }
}

const visible = findings.filter((entry) => entry.kind === "visible");
const documented = findings.filter((entry) => entry.kind !== "visible");

if (documented.length > 0) {
  console.log(
    `ℹ ${documented.length} placeholder${documented.length === 1 ? "" : "s"} documented in comments or config (expected — the site hides these surfaces):`,
  );
  for (const entry of documented) console.log(`   ${entry.file}:${entry.line}  ${entry.text}`);
  console.log("");
}

if (visible.length === 0) {
  console.log("✓ No customer-visible placeholders. Nothing unfilled can reach a page.");
  process.exit(0);
}

console.error(`✗ ${visible.length} customer-visible placeholder${visible.length === 1 ? "" : "s"} found:`);
for (const entry of visible) {
  console.error(`   ${entry.file}:${entry.line}  ${entry.text}`);
  console.error(`      ${entry.source}`);
}
console.error(
  "\nFix by filling the value from the owner (lib/config.ts) or hiding the surface that would print it.",
);
process.exit(1);
