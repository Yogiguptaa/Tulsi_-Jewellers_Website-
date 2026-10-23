#!/usr/bin/env node
/**
 * npm run rates:fetch — one real fetch, then print exactly what was stored.
 *
 * Calls the running dev server (default http://localhost:3210) so the same
 * validation, storage and plausibility rules run as in production. Start the
 * app first (`npm run dev`), then run this.
 *
 *   npm run rates:fetch              # normal run (skips if today is stored)
 *   npm run rates:fetch -- --force   # ignore freshness, fetch again
 *   npm run rates:fetch -- --port 3000
 */

const args = process.argv.slice(2);
const portFlag = args.indexOf("--port");
// `PORT=0` in a shell environment means "any free port", not the dev server's.
const envPort = process.env.PORT && process.env.PORT !== "0" ? process.env.PORT : null;
const port = portFlag >= 0 ? args[portFlag + 1] : envPort || "3210";
const force = args.includes("--force");
const base = process.env.RATES_FETCH_URL || `http://localhost:${port}`;
const url = `${base.replace(/\/$/, "")}/api/dev/fetch-rates${force ? "?force=1" : ""}`;

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

let response;
try {
  response = await fetch(url, { headers: { accept: "application/json" } });
} catch {
  fail(
    `No dev server answered on port ${port}.`,
    "Start it with `npm run dev`, then run this again.",
  );
}

if (response.status === 404) {
  fail("The fetch endpoint is only available in development.", "Run `npm run dev` (not a production build).");
}

const body = await response.json().catch(() => null);
if (!body) fail(`The server answered HTTP ${response.status} without JSON.`);

console.log(`\nProvider: ${body.provider?.active ?? "unknown"}`);
if (body.provider?.problem) console.log(`Note: ${body.provider.problem}`);
console.log(`Job: ${body.job?.skipped ? "skipped" : body.job?.ok ? "ok" : "failed"} — ${body.job?.message ?? ""}`);
if (body.job?.insert) {
  const i = body.job.insert;
  console.log(
    `Stored ${i.inserted}, duplicates ${i.duplicates}, pending ${i.pending}, rejected ${i.rejected}`,
  );
}

const rows = body.storedRows ?? [];
if (rows.length === 0) {
  console.log("\nNo rows stored yet. The reason is printed above.");
  process.exit(body.job?.ok ? 0 : 1);
}

console.log("\nLatest stored rows (INR):");
for (const row of rows) {
  const unit = row.unit === "INR_PER_KG" ? "/kg" : "/10g";
  console.log(
    `  ₹ ${inr.format(row.rate).padStart(12)} ${unit.padEnd(5)}  ${row.metal} ${row.purity}  ` +
      `₹${inr.format(row.perGram)}/g  ${row.observedAt}  ${row.source}`,
  );
}
console.log("");
