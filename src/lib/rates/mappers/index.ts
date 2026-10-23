/**
 * rates/mappers/index.ts — the mapper registry.
 *
 * A mapper is selected from configuration, never guessed at runtime:
 *   1. RATE_API_PROVIDER, when set, names the mapper exactly.
 *   2. otherwise the host of RATE_API_URL is matched against the mapper's hosts.
 *
 * If neither identifies a mapper, the external provider stays inactive and the
 * manual provider keeps serving — a misconfigured key must never silently fall
 * back to a *different* provider's numbers.
 */

import { metalsDevMapper } from "./metals-dev";
import type { ProviderConfig, RateMapper, ReturnedUnit } from "./types";

export const MAPPERS: readonly RateMapper[] = [metalsDevMapper];

export type MapperResolution = { ok: true; mapper: RateMapper } | { ok: false; reason: string };

/** Never print an API key: this is the only thing about it we ever report. */
export function hasApiKey(apiKey: string): boolean {
  return apiKey.trim().length > 0;
}

/** The host of the configured endpoint, for the admin card. Query is dropped. */
export function endpointHost(apiUrl: string): string | null {
  try {
    return new URL(apiUrl.trim()).host || null;
  } catch {
    return null;
  }
}

export function parseDeclaredUnit(raw: string | undefined): ReturnedUnit {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "g" || value === "gram" || value === "grams") return "g";
  if (value === "kg" || value === "kilogram") return "kg";
  if (value === "toz" || value === "oz" || value === "troy_ounce") return "toz";
  if (value === "10g") return "10g";
  return "unknown";
}

export function resolveMapper(config: ProviderConfig): MapperResolution {
  const requested = config.providerId.trim().toLowerCase();

  if (requested) {
    const byId = MAPPERS.find((mapper) => mapper.id === requested);
    if (byId) return { ok: true, mapper: byId };
    return {
      ok: false,
      reason:
        `RATE_API_PROVIDER="${requested}" does not match any mapper. ` +
        `Supported: ${MAPPERS.map((mapper) => mapper.id).join(", ")}.`,
    };
  }

  const host = endpointHost(config.apiUrl);
  if (!host) {
    return { ok: false, reason: "RATE_API_URL is missing or is not a valid absolute URL." };
  }

  const byHost = MAPPERS.find((mapper) => mapper.hosts.some((known) => host === known || host.endsWith(`.${known}`)));
  if (byHost) return { ok: true, mapper: byHost };

  return {
    ok: false,
    reason:
      `RATE_API_URL points at "${host}", which no mapper serves. ` +
      `Supported hosts: ${MAPPERS.flatMap((mapper) => mapper.hosts).join(", ")}. ` +
      "Set RATE_API_PROVIDER once its mapper file exists.",
  };
}
