#!/usr/bin/env node
/**
 * scripts/check-rate-provider.mjs — see exactly what the provider returns.
 *
 * WHY: before the feed is switched on for customers, the shopkeeper (or whoever
 * set the key up) needs to SEE one real response — the currency, the unit and the
 * fields — because those decide whether the numbers can be converted safely. The
 * API key is never printed: it is redacted from the response and from every line
 * of output this script writes.
 *
 * USAGE
 *   node scripts/check-rate-provider.mjs                # reads .env.local
 *   RATE_API_KEY=… node scripts/check-rate-provider.mjs # or from the environment
 *
 * It prints the raw JSON shape and a converted table, then tells you what to
 * confirm. Nothing here writes to the database and nothing here is imported by
 * the app — the app's own mapping lives in src/lib/rates/mappers/.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TROY_OUNCE_GRAMS = 31.1034768;
const REDACTED = "«redacted»";

/** Minimal .env.local reader — no dependency, and real env vars always win. */
function readEnvFile(path) {
  const values = {};
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return values;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const fileEnv = readEnvFile(resolve(process.cwd(), ".env.local"));
const env = { ...fileEnv, ...process.env };

const apiKey = env.RATE_API_KEY ?? "";
const apiUrl = env.RATE_API_URL ?? "";
const provider = (env.RATE_PROVIDER ?? "manual").trim();
const authority = (env.RATE_API_AUTHORITY ?? "ibja").trim();
const declaredUnit = (env.RATE_API_UNIT ?? "").trim();

function fail(message) {
  console.error(`✖ ${message}`);
  process.exitCode = 1;
}

if (provider !== "external") {
  console.warn(
    `! RATE_PROVIDER is "${provider}". The app is using manual entry, so this check is only a preview of the feed.`,
  );
}
if (!apiKey) {
  fail("RATE_API_KEY is not set (looked in .env.local and the environment).");
  process.exit(1);
}
if (!apiUrl) {
  fail("RATE_API_URL is not set (looked in .env.local and the environment).");
  process.exit(1);
}

/** Same request the metals.dev mapper builds: INR, per gram, IBJA authority. */
function buildUrl() {
  let endpoint = "https://api.metals.dev/v1/metal/authority";
  try {
    const url = new URL(apiUrl);
    if (url.pathname && url.pathname !== "/") endpoint = url.toString();
  } catch {
    fail(`RATE_API_URL ("${apiUrl}") is not a valid absolute URL.`);
    process.exit(1);
  }
  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("authority", authority);
  url.searchParams.set("currency", "INR");
  // Grams, so the gram → 10 g arithmetic stays visible in our own code.
  url.searchParams.set("unit", "g");
  return url;
}

const url = buildUrl();
const safeUrl = new URL(url.toString());
safeUrl.searchParams.set("api_key", REDACTED);

console.log(`→ GET ${safeUrl.toString()}\n`);

const response = await fetch(url, { headers: { Accept: "application/json" }, redirect: "error" });
const bodyText = await response.text();
console.log(`← HTTP ${response.status} ${response.statusText}`);

if (!response.ok) {
  console.log(`\n${bodyText.slice(0, 1200).split(apiKey).join(REDACTED)}\n`);
  fail("The provider refused the request. Nothing was changed locally.");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(bodyText);
} catch {
  fail("The response was not JSON.");
  process.exit(1);
}

/** Redact the key wherever it could echo back, then pretty-print. */
function redact(text) {
  return text.split(apiKey).join(REDACTED);
}

console.log("\n--- raw response (key redacted) -------------------------------------\n");
console.log(redact(JSON.stringify(payload, null, 2)));
console.log("\n--- what the mapper would read --------------------------------------\n");

const table = payload?.rates ?? payload?.metals;
const stamp = payload?.timestamp ?? payload?.timestamps?.metal ?? null;
console.log(`status    : ${payload?.status ?? "(missing)"}`);
console.log(`currency  : ${payload?.currency ?? "(missing)"}${payload?.currency === "INR" ? "" : "   ← must be INR"}`);
console.log(`unit      : ${payload?.unit ?? "(missing)"}`);
console.log(`timestamp : ${stamp ?? "(missing)"}   ← the provider's own time, never “now”`);

const known = new Set([
  "g",
  "gram",
  "grams",
  "kg",
  "kilogram",
  "kgs",
  "toz",
  "oz",
  "troy_ounce",
  "10g",
  "10 g",
]);
const statedUnit = typeof payload?.unit === "string" ? payload.unit.trim().toLowerCase() : "";
const effective = known.has(statedUnit) ? statedUnit : declaredUnit || null;

if (!effective) {
  console.log(
    "\n! The response does not state a usable unit, and RATE_API_UNIT is not set.\n" +
      "  The app REFUSES to convert in that case — that is how a per-troy-ounce price\n" +
      `  becomes a wrong per-10-gram rate. Decide from the values above and set RATE_API_UNIT.`,
  );
} else {
  console.log(`\nconverting as: INR per ${effective}${known.has(statedUnit) ? "" : " (from RATE_API_UNIT)"}`);

  const perGram = (value) => {
    if (!Number.isFinite(value)) return null;
    if (effective === "g" || effective === "gram" || effective === "grams") return value;
    if (effective === "kg" || effective === "kilogram" || effective === "kgs") return value / 1000;
    if (effective === "toz" || effective === "oz" || effective === "troy_ounce")
      return value / TROY_OUNCE_GRAMS;
    if (effective === "10g" || effective === "10 g") return value / 10;
    return null;
  };

  const money = (value) =>
    value === null ? "—" : `₹ ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  console.log("\nfield                 value as sent        as ₹ per 10 g / kg");
  console.log("--------------------  -------------------  --------------------------");
  for (const [field, value] of Object.entries(table ?? {})) {
    const numeric = typeof value === "number" ? value : Number(value);
    const gram = perGram(numeric);
    if (gram === null) continue;
    const isSilver = /silver/i.test(field);
    console.log(
      `${field.padEnd(20)}  ${String(value).padEnd(19)}  ${money(isSilver ? gram * 1000 : gram * 10)}`,
    );
  }
}

console.log(
  "\n--- to confirm ------------------------------------------------------\n" +
    "1. Which fineness each field really is (e.g. is ibja_gold 999/24K?).\n" +
    "2. Whether the converted ₹ values look like real Indian gold and silver rates.\n" +
    "3. Then delete the matching entry from the `assumptions` list in\n" +
    "   src/lib/rates/mappers/metals-dev.ts so the admin panel stops asking.\n" +
    "4. Nothing was stored. The app stores values only through the cron route,\n" +
    "   and only after the Stage 11 migration has been run.\n" +
    "\nCost and licence checklist: docs/RATE_PROVIDER.md",
);
