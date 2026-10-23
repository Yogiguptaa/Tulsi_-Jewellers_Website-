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

/** Retries network errors and HTTP 5xx three times; everything else is final. */
export async function fetchJsonWithRetry(
  url: string,
  headers: Record<string, string>,
): Promise<unknown> {
  const attempts = 3;
  let lastError: Error = new Error("The rate provider could not be reached.");

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json", ...headers },
        cache: "no-store",
        // A redirect would carry the bearer token to another host.
        redirect: "error",
      });
    } catch {
      lastError = new Error("The rate provider could not be reached (network error).");
      if (attempt < attempts) {
        await sleep(500 * attempt * attempt);
        continue;
      }
      throw lastError;
    }

    if (response.status >= 500) {
      lastError = new Error(`The rate provider responded with HTTP ${response.status}.`);
      if (attempt < attempts) {
        await sleep(500 * attempt * attempt);
        continue;
      }
      throw lastError;
    }
    if (!response.ok) throw new Error(`The rate provider responded with HTTP ${response.status}.`);

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new Error("The rate provider returned a response that was not valid JSON.");
    }
  }
  throw lastError;
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
