/**
 * rates/localStore.ts — SERVER-ONLY, append-only fallback for local work.
 *
 * WHY
 * ───
 * Supabase is the production store. But the site must still show a real rate on
 * a laptop before the database is connected — otherwise the first thing the
 * owner sees is "rate unavailable", which looks broken. When (and only when)
 * Supabase is not configured, the rate job writes to one JSON file instead:
 *
 *     .data/rates.json      (git-ignored, development only)
 *
 * It keeps exactly the same rules as the database path: append-only rows, the
 * same validated fields, deduplication on (series + observation time + source),
 * the same plausibility threshold and the same monthly call counter. Nothing
 * here invents a value, and nothing here is used once Supabase exists.
 *
 * NOT FOR PRODUCTION: a serverless filesystem is read-only/ephemeral, so the
 * deploy guide requires Supabase. If the file cannot be written, the caller
 * reports a failure rather than pretending the rate was stored.
 */

import path from "node:path";
import { getLocalFs, isCloudflareWorker } from "@/lib/runtime/local-disk";
import type { MarketSession } from "./types";

export type LocalRateRow = {
  id: string;
  metal: "gold" | "silver";
  purity: string;
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
  rate: number;
  source: string;
  provider: string;
  rate_type: string;
  observed_at: string;
  fetched_at: string;
  market_session: MarketSession;
  gst_included: boolean;
  making_charges_included: boolean;
  approval_status: "auto" | "pending" | "approved";
  approval_reason: string | null;
  delta_pct: number | null;
};

type UsageEntry = { month: string; calls: number; lastCallAt: string | null };
type JobEntry = { status: string; message: string; at: string; rowsAffected: number };

type StoreFile = {
  version: 1;
  rows: LocalRateRow[];
  usage: Record<string, UsageEntry>;
  locks: Record<string, string>;
  jobs: JobEntry[];
};

const EMPTY: StoreFile = { version: 1, rows: [], usage: {}, locks: {}, jobs: [] };
/** Old rows are kept for the history chart; this is a local debug store, not an archive. */
const MAX_ROWS = 5000;
const MAX_JOBS = 50;

function storePath(): string {
  const dir = process.env.RATE_STORE_DIR?.trim() || ".data";
  return path.resolve(process.cwd(), dir, "rates.json");
}

/**
 * Available only while developing (`next dev`) on a machine with a disk.
 *
 * Three things must all hold:
 *
 *   - `next build` and every deployed runtime run with NODE_ENV=production. A
 *     production build must never read a developer's `.data/` file: it would
 *     bake that laptop's rate and timestamp into the prerendered pages, then
 *     freeze there because no provider is configured to replace it.
 *   - Cloudflare Workers have no writable disk (see runtime/local-disk.ts).
 *   - An operator can switch it off explicitly with RATE_LOCAL_STORE=off.
 *
 * In production the store is Supabase, and without Supabase the board says so
 * honestly instead of showing a number nobody verified today.
 */
export function localStoreAvailable(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.RATE_LOCAL_STORE === "off") return false;
  if (isCloudflareWorker()) return false;
  return true;
}

export function localStoreFile(): string {
  return storePath();
}

/**
 * One writer at a time. The cron route, a page view and "Fetch now" can overlap;
 * without this, two read-modify-write cycles would drop rows.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialise<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  // Keep the chain alive even when a task rejects.
  queue = next.catch(() => undefined);
  return next;
}

async function readStore(): Promise<StoreFile> {
  const fs = await getLocalFs();
  if (!fs) return { ...EMPTY, rows: [], usage: {}, locks: {}, jobs: [] };
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreFile>;
    return {
      version: 1,
      rows: Array.isArray(parsed.rows) ? (parsed.rows as LocalRateRow[]) : [],
      usage: parsed.usage && typeof parsed.usage === "object" ? (parsed.usage as Record<string, UsageEntry>) : {},
      locks: parsed.locks && typeof parsed.locks === "object" ? (parsed.locks as Record<string, string>) : {},
      jobs: Array.isArray(parsed.jobs) ? (parsed.jobs as JobEntry[]) : [],
    };
  } catch {
    // Missing file (first run) and a corrupt file both start from empty; the
    // corrupt copy is left untouched so it can be inspected.
    return { ...EMPTY, rows: [], usage: {}, locks: {}, jobs: [] };
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  const fs = await getLocalFs();
  // Throwing (not silently returning) keeps every caller's existing
  // try/catch honest: a rate that was not written is reported as a failure.
  if (!fs) throw new Error("this runtime has no writable filesystem");
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/* -------------------------------------------------------------------------- */
/* Rows                                                                        */
/* -------------------------------------------------------------------------- */

/** Publishable rows, newest observation first. Never pending ones. */
export async function readLocalRows(limit = 400): Promise<LocalRateRow[]> {
  const store = await readStore();
  return store.rows
    .filter((row) => row.approval_status === "auto" || row.approval_status === "approved")
    .sort((a, b) => Date.parse(b.observed_at) - Date.parse(a.observed_at))
    .slice(0, limit);
}

export async function readLocalPreviousValue(series: {
  metal: string;
  purity: string;
  unit: string;
}): Promise<{ rate: number; source: string; observedAt: string } | null> {
  const rows = await readLocalRows(5000);
  const row = rows.find(
    (entry) => entry.metal === series.metal && entry.purity === series.purity && entry.unit === series.unit,
  );
  if (!row) return null;
  return { rate: row.rate, source: row.source, observedAt: row.observed_at };
}

export async function insertLocalRate(row: LocalRateRow): Promise<"inserted" | "duplicate" | "error"> {
  return serialise(async () => {
    try {
      const store = await readStore();
      const duplicate = store.rows.some(
        (entry) =>
          entry.metal === row.metal &&
          entry.purity === row.purity &&
          entry.unit === row.unit &&
          entry.observed_at === row.observed_at &&
          entry.source === row.source,
      );
      if (duplicate) return "duplicate";
      store.rows.push(row);
      if (store.rows.length > MAX_ROWS) store.rows = store.rows.slice(-MAX_ROWS);
      await writeStore(store);
      return "inserted";
    } catch {
      return "error";
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Usage, locks and job log                                                    */
/* -------------------------------------------------------------------------- */

function istMonth(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(now));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}`;
}

function startOfIstDay(now = Date.now()): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  return new Date(`${day}T00:00:00+05:30`).toISOString();
}

export async function readLocalUsage(provider: string): Promise<UsageEntry & { month: string }> {
  const store = await readStore();
  const month = istMonth();
  const entry = store.usage[provider];
  if (!entry || entry.month !== month) return { month, calls: 0, lastCallAt: null };
  return entry;
}

export async function reserveLocalCall(provider: string): Promise<{ month: string; calls: number; lastCallAt: string | null }> {
  return serialise(async () => {
    const store = await readStore();
    const month = istMonth();
    const current = store.usage[provider];
    const calls = current && current.month === month ? current.calls : 0;
    const entry: UsageEntry = { month, calls: calls + 1, lastCallAt: new Date().toISOString() };
    store.usage[provider] = entry;
    try {
      await writeStore(store);
    } catch {
      // Accounting is best-effort locally; the fetch itself still matters more.
    }
    return entry;
  });
}

export async function localHasRecent(provider: string, hours: number): Promise<boolean> {
  const since = Date.now() - hours * 3_600_000;
  const rows = await readLocalRows(50);
  return rows.some((row) => row.provider === provider && Date.parse(row.observed_at) >= since);
}

export async function localHasToday(provider: string): Promise<boolean> {
  const since = Date.parse(startOfIstDay());
  const rows = await readLocalRows(50);
  return rows.some((row) => row.provider === provider && Date.parse(row.observed_at) >= since);
}

export async function claimLocalLock(provider: string, minutes = 5): Promise<boolean> {
  return serialise(async () => {
    const store = await readStore();
    const now = Date.now();
    const held = store.locks[provider];
    if (held && Date.parse(held) > now) return false;
    store.locks[provider] = new Date(now + minutes * 60_000).toISOString();
    try {
      await writeStore(store);
      return true;
    } catch {
      return false;
    }
  });
}

export async function releaseLocalLock(provider: string): Promise<void> {
  await serialise(async () => {
    try {
      const store = await readStore();
      store.locks[provider] = new Date(0).toISOString();
      await writeStore(store);
    } catch {
      // The lock expires by itself.
    }
  });
}

export async function appendLocalJobLog(status: string, message: string, rowsAffected = 0): Promise<void> {
  await serialise(async () => {
    try {
      const store = await readStore();
      store.jobs.push({ status, message, at: new Date().toISOString(), rowsAffected });
      if (store.jobs.length > MAX_JOBS) store.jobs = store.jobs.slice(-MAX_JOBS);
      await writeStore(store);
    } catch {
      // Logging must never turn a successful ingest into a failure.
    }
  });
}

export async function readLocalJobLogs(limit = 5): Promise<JobEntry[]> {
  const store = await readStore();
  return store.jobs.slice(-limit).reverse();
}
