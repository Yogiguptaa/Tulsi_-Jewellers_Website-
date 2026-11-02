/**
 * lib/safeFetch.ts — the one way this site talks to someone else's server.
 *
 * A failed upstream must never take a page down, and it must never leak a stack
 * trace to a customer. Every call therefore returns a `Result`: it never throws,
 * it times out, it retries only what is worth retrying (network errors, 5xx, 429),
 * and it validates the payload before anything reads it.
 *
 * Why not retry a 4xx: a 401, 403 or 404 is the other server's decision. Retrying
 * it burns quota and produces the "the job failed after 3 seconds" behaviour that
 * a wrong key causes — the failure needs to surface, not be retried.
 *
 * Logs are one JSON line per final failure, with the label, the kind and the HTTP
 * status only. URLs are not logged: an API key in a query string would end up in
 * the platform's log viewer.
 */

import type { ZodType } from "zod";

export type FetchFailureKind = "timeout" | "network" | "http" | "json" | "validation";

export type FetchFailure = {
  kind: FetchFailureKind;
  /** Safe to log and safe to show in an admin panel. Never rendered to a customer. */
  message: string;
  status?: number;
  attempts: number;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: FetchFailure };

export type SafeFetchOptions<T> = {
  /** A Zod schema; when given, the payload is checked before it is returned. */
  schema?: ZodType<T>;
  headers?: Record<string, string>;
  /** Per-attempt timeout. Default 8 s — long enough for a slow API, short enough to fail before a request times out. */
  timeoutMs?: number;
  /** Total attempts, including the first. Default 3. */
  attempts?: number;
  /** Short name for the log line, e.g. "rates:spot". Never include a secret. */
  label?: string;
  /** An outer abort signal (request cancelled, page navigated away). */
  signal?: AbortSignal;
  method?: "GET" | "POST";
  body?: string;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with jitter, so a burst of failures does not synchronise. */
function backoffMs(attempt: number): number {
  const base = Math.min(4_000, 300 * 2 ** (attempt - 1));
  return base + Math.floor(Math.random() * 250);
}

function logFailure(label: string, failure: FetchFailure): void {
  console.error(
    JSON.stringify({
      scope: "safeFetch",
      label,
      kind: failure.kind,
      status: failure.status ?? null,
      attempts: failure.attempts,
      at: new Date().toISOString(),
    }),
  );
}

async function readJson(response: Response): Promise<Result<unknown>> {
  try {
    return { ok: true, data: (await response.json()) as unknown };
  } catch {
    return {
      ok: false,
      error: { kind: "json", message: "The response was not valid JSON.", attempts: 1 },
    };
  }
}

/**
 * Fetch JSON safely. Never throws: inspect `result.ok`.
 */
export async function safeFetchJson<T = unknown>(
  url: string,
  options: SafeFetchOptions<T> = {},
): Promise<Result<T>> {
  const {
    schema,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    attempts = DEFAULT_ATTEMPTS,
    label = "fetch",
    signal,
    method = "GET",
    body,
  } = options;

  let lastFailure: FetchFailure = {
    kind: "network",
    message: "The request could not be made.",
    attempts: 0,
  };

  for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
    if (signal?.aborted) {
      lastFailure = { kind: "network", message: "The request was cancelled.", attempts: attempt };
      break;
    }

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        body,
        headers: { Accept: "application/json", ...headers },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = controller.signal.aborted;
      lastFailure = aborted
        ? {
            kind: "timeout",
            message: `No answer within ${timeoutMs} ms.`,
            attempts: attempt,
          }
        : {
            kind: "network",
            message: error instanceof Error ? error.message : "The request could not be made.",
            attempts: attempt,
          };
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (attempt < attempts) {
        await sleep(backoffMs(attempt));
        continue;
      }
      break;
    }
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);

    if (response.status === 429 || response.status >= 500) {
      lastFailure = {
        kind: "http",
        message: `HTTP ${response.status}.`,
        status: response.status,
        attempts: attempt,
      };
      if (attempt < attempts) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(5_000, retryAfter * 1_000)
          : backoffMs(attempt);
        await sleep(wait);
        continue;
      }
      break;
    }

    if (!response.ok) {
      lastFailure = {
        kind: "http",
        message: `HTTP ${response.status}.`,
        status: response.status,
        attempts: attempt,
      };
      break;
    }

    const parsed = await readJson(response);
    if (!parsed.ok) {
      lastFailure = { ...parsed.error, attempts: attempt };
      break;
    }

    if (!schema) return { ok: true, data: parsed.data as T };

    const checked = schema.safeParse(parsed.data);
    if (!checked.success) {
      lastFailure = {
        kind: "validation",
        message: "The response did not match the expected shape.",
        attempts: attempt,
      };
      break;
    }

    return { ok: true, data: checked.data };
  }

  logFailure(label, lastFailure);
  return { ok: false, error: lastFailure };
}
