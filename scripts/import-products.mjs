#!/usr/bin/env node
/**
 * scripts/import-products.mjs — build the catalogue the site reads.
 *
 *   npm run catalogue:import     validate the CSV, then write products.json
 *   npm run catalogue:check      validate only; also fails if products.json is stale
 *   npm run catalogue:sample     prove the pipeline with the sample file (writes .data/)
 *
 * Files:
 *   in   content/catalogue/products.csv        (edit this; Excel/Sheets can export it)
 *   out  src/content/catalogue/products.json   (generated — do not hand-edit)
 *
 * Nothing is written when a row fails validation: the previous catalogue stays
 * live rather than publishing half a file. Errors name the CSV line and the
 * column, never a stack trace.
 */

import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, buildProductFile, sameProducts, validateRecords } from "./lib/catalogue-import.mjs";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

if (has("--help") || has("-h")) {
  console.log(
    [
      "Usage: node scripts/import-products.mjs [options]",
      "",
      "  --in <file>    CSV to read   (default content/catalogue/products.csv)",
      "  --out <file>   JSON to write (default src/content/catalogue/products.json)",
      "  --check        validate only; exit 1 if a row is invalid or the JSON is stale",
      "  --help         this text",
    ].join("\n"),
  );
  process.exit(0);
}

const inputPath = path.resolve(PROJECT_ROOT, valueOf("--in", "content/catalogue/products.csv"));
const outputPath = path.resolve(
  PROJECT_ROOT,
  valueOf("--out", "src/content/catalogue/products.json"),
);
const checkOnly = has("--check");
const relative = (file) => path.relative(PROJECT_ROOT, file).replace(/\\/g, "/");

function die(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  die(
    `CSV not found: ${relative(inputPath)}\n` +
      "  Copy content/catalogue/products.sample.csv to content/catalogue/products.csv and edit it.",
  );
}

const csv = fs.readFileSync(inputPath, "utf8");
const { products, errors, warnings } = validateRecords(csv, { now: new Date() });

for (const warning of warnings) {
  console.warn(`  ! line ${warning.line}: ${warning.message}`);
}

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} problem(s) found in ${relative(inputPath)}:`);
  for (const error of errors) {
    console.error(`  line ${error.line}: ${error.message}`);
  }
  console.error("\nNothing was written. Fix the rows above and run again.\n");
  process.exit(1);
}

const file = buildProductFile(products, { source: relative(inputPath) });

if (checkOnly) {
  if (!fs.existsSync(outputPath)) {
    die(`${relative(outputPath)} is missing. Run: npm run catalogue:import`);
  }
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  if (!sameProducts(existing, file)) {
    die(`${relative(outputPath)} is out of date with the CSV.\n  Run: npm run catalogue:import`);
  }
  console.log(`✓ catalogue CSV valid and products.json is up to date (${products.length} product(s))`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");

const byType = products.reduce((counts, product) => {
  counts[product.catalogueType] = (counts[product.catalogueType] ?? 0) + 1;
  return counts;
}, {});

console.log(
  `✓ wrote ${products.length} product(s) to ${relative(outputPath)}\n` +
    `  showroom ${byType.showroom ?? 0} · inspiration ${byType.inspiration ?? 0} · supplier ${byType.supplier ?? 0}`,
);
