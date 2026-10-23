/**
 * runtime/local-disk.ts — SERVER-ONLY. The `.data/` fallbacks need a real disk.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Two fallbacks only run when Supabase is not configured: enquiries append to
 * `.data/enquiries.jsonl`, and the rate job writes `.data/rates.json`. Both are
 * for a laptop or a self-hosted Node server.
 *
 * Cloudflare Workers (where this site is deployed) expose `node:path`,
 * `node:crypto` and `node:buffer` through `nodejs_compat`, but not `node:fs`.
 * A static `import "node:fs/promises"` at the top of a module is resolved and
 * evaluated even when the fallback is never reached, so the Worker bundle would
 * fail before a single request. Importing lazily here keeps the disk code out of
 * the Worker's hot path: on Workers the import rejects, `getLocalFs()` returns
 * `null`, and the caller reports "no writable store" instead of pretending.
 */

export type LocalFs = {
  appendFile: typeof import("node:fs/promises").appendFile;
  mkdir: typeof import("node:fs/promises").mkdir;
  readFile: typeof import("node:fs/promises").readFile;
  rename: typeof import("node:fs/promises").rename;
  writeFile: typeof import("node:fs/promises").writeFile;
};

let cached: Promise<LocalFs | null> | undefined;

/** The filesystem API, or `null` when this runtime has none. Never throws. */
export function getLocalFs(): Promise<LocalFs | null> {
  cached ??= import("node:fs/promises")
    .then((fs) => fs as LocalFs)
    .catch(() => null);
  return cached;
}

/**
 * True on Cloudflare Workers, where `navigator.userAgent` is exactly the string
 * below. Used to switch the local fallbacks off *before* any I/O is attempted,
 * so a Worker never even tries to write to a disk that cannot exist.
 */
export function isCloudflareWorker(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}
