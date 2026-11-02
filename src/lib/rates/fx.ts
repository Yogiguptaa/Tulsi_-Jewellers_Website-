import { safeFetchJson } from "@/lib/safeFetch";

/**
 * rates/fx.ts — SERVER-ONLY helpers shared by the automatic feeds.
 *
 * Two things every USD-quoted provider needs:
 *   1. a JSON fetch that retries network errors and 5xx responses only (a 4xx,
 *      including 429, is a decision, not a blip), and
 *   2. a USD→INR reference rate, because an Indian shop quotes rupees.
 *
 * The FX rate is either pinned by the owner (`RATE_USD_INR`) or read from the
 * documented Frankfurter daily reference endpoint. An implausible value is
 * refused rather than applied — a wrong FX rate silently produces a wrong gold
 * rate, which is exactly the failure this system exists to prevent.
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One real HTTP call for a rate feed.
 *
 * The retry, timeout and "never throw from the transport" rules live in
 * `lib/safeFetch.ts`; this wrapper only translates its typed failure into the
 * sentences the admin panel shows. A 4xx stays final (a wrong key must surface,
 * not loop), a 5xx or a dropped connection gets three attempts, and a call that
 * hangs is cut off instead of holding the request open.
 */
export async function fetchJsonWithRetry(
  url: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const result = await safeFetchJson(url, { headers, attempts: 3, label: "rates:feed" });
  if (result.ok) return result.data;

  const { kind, message, status } = result.error;
  if (kind === "http") throw new Error(`The rate provider responded with HTTP ${status ?? message}.`);
  if (kind === "json") throw new Error("The rate provider returned a response that was not valid JSON.");
  if (kind === "timeout") throw new Error("The rate provider did not answer in time.");
  throw new Error("The rate provider could not be reached (network error).");
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

/**
 * USD→INR. `RATE_USD_INR` wins when set (useful when the daily reference rate
 * is unavailable); otherwise the Frankfurter daily reference endpoint is read.
 */
export async function usdToInr(): Promise<{ rate: number; source: string }> {
  const pinned = Number(process.env.RATE_USD_INR);
  if (Number.isFinite(pinned) && pinned > 0) {
    return { rate: pinned, source: "RATE_USD_INR (owner-set)" };
  }

  const url = (process.env.RATE_FX_URL ?? "https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR").trim();
  const payload = await fetchJsonWithRetry(url, {});
  const body = asRecord(payload, "The exchange-rate service returned an unexpected response.");
  const rates = asRecord(body.rates, "The exchange-rate service returned no rates.");
  const inr = rates.INR;
  const value = typeof inr === "number" ? inr : Number(inr);
  if (!Number.isFinite(value) || value < 20 || value > 500) {
    throw new Error(
      "The USD→INR reference rate was missing or implausible, so the spot price was not converted. " +
        "Set RATE_USD_INR to the day's rate and run again.",
    );
  }
  return { rate: value, source: "Frankfurter daily reference rate" };
}
