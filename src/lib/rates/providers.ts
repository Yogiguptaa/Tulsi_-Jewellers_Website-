/**
 * rates/providers.ts — which rate source is switched on, and nothing else.
 *
 * TWO PROVIDERS, NEVER A BLEND
 * ────────────────────────────
 *  1. MANUAL (default, free, works today)
 *     The showroom records each published benchmark in the admin panel. Every
 *     stored row keeps its source, session and GST status, and the public page
 *     shows exactly what was recorded. Rows are labelled "Entered by Tulsi
 *     Jewellers" when the admin leaves the default source text alone.
 *
 *  2. EXTERNAL (optional licensed feed)
 *     Three environment variables switch it on:
 *         RATE_PROVIDER=external
 *         RATE_API_URL=https://api.metals.dev/v1/metal/authority   (or just the host)
 *         RATE_API_KEY=…                                           (server-only)
 *     The provider-specific mapping lives in exactly one file under
 *     `rates/mappers/` (currently `metals-dev.ts`), chosen from RATE_API_URL's
 *     host — or pinned with RATE_API_PROVIDER. All the validation, storage and
 *     display code below is provider-agnostic: adding another provider means
 *     adding one mapper file and one registry entry.
 *
 * RULES THIS FILE ENFORCES
 *  • Keys are read from the server environment only (`.env.local` in
 *    development, Vercel environment variables in production). They are never
 *    logged, never returned in a status object and never sent to a browser.
 *  • If RATE_PROVIDER=external is requested but cannot be honoured (no URL, no
 *    key, unknown mapper), the external provider stays inactive and the reason
 *    is reported to the admin panel. The system never quietly substitutes
 *    another provider's numbers.
 *  • The active provider's name is stored on every row it writes, and the rates
 *    page prints it next to the value.
 */

import { hasApiKey, endpointHost, parseDeclaredUnit, resolveMapper, MAPPERS } from "./mappers";
import type { ProviderConfig, ProviderFetchResult, RateMapper } from "./mappers/types";
import type { ProviderStatus, RateObservation } from "./types";
import { METALS_DEV_HOST, metalsDevProvider } from "./providers/metalsDev";
import { METALCHARTS_HOST, metalChartsProvider } from "./providers/metalCharts";
import { SPOT_GOLD_ENDPOINT, spotProvider } from "./providers/spot";
import { indiaProvider } from "./providers/india";

export const SPOT_HOST = new URL(SPOT_GOLD_ENDPOINT).host;

// Re-exported so existing callers keep one import site for the shared shapes.
export type { ProviderFetchResult, RawRate } from "./mappers/types";

export type ProviderKind = "manual" | "external";

export interface RateProvider {
  kind: ProviderKind;
  /**
   * Value written to `metal_rates.provider`. Defaults to `kind` ("manual" or
   * "external"); a named feed records its own id ("metalsdev") so an admin can
   * tell one automatic source from another.
   */
  recordAs?: string;
  /** Name recorded on every row written by this provider. */
  sourceName: string;
  /** Shown on the rates page and in the admin panel. */
  label: string;
  note: string;
  /** "published" benchmarks may never be labelled "Live". */
  publication: "published" | "intraday" | "manual";
  /** Customer-facing sentence printed under the rate board, verbatim. */
  customerNote?: string;
  /** How often the source changes; documents the cron schedule. */
  refreshMinutes: number | null;
  isConfigured(): boolean;
  /**
   * Pull the latest published values. Only the external provider can do this;
   * the manual provider throws so callers cannot pretend a fetch happened.
   */
  fetchLatest(): Promise<ProviderFetchResult>;
}

/* -------------------------------------------------------------------------- */
/* Configuration — read at call time, from the server environment only          */
/* -------------------------------------------------------------------------- */

/**
 * The name stored on every hand-entered row, and printed to customers as the
 * source. It names the shop, because that is who is answerable for the value —
 * with the benchmark it was read from in brackets.
 */
const MANUAL_SOURCE_NAME = "Entered by Tulsi Jewellers (IBJA benchmark)";

function readConfig(): ProviderConfig {
  return {
    apiKey: process.env.RATE_API_KEY ?? "",
    apiUrl: process.env.RATE_API_URL ?? "",
    providerId: process.env.RATE_API_PROVIDER ?? "",
    // Only used when a provider does not state the unit its numbers are in.
    declaredUnit: parseDeclaredUnit(process.env.RATE_API_UNIT),
  };
}

/**
 * RATE_PROVIDER. MetalCharts is the default feed; an unrecognised value falls
 * back to manual entry with a warning in the admin panel.
 */
function requestedProvider(): {
  requested: "manual" | "external" | "metalsdev" | "metalcharts" | "spot" | "india";
  warn: string | null;
} {
  const raw = (process.env.RATE_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "") {
    // India first, always. A converted international spot price sits 15–22%
    // below what an Indian counter quotes, so it can never be the default: the
    // showroom's Indian benchmark is. Spot stays available, but only as an
    // explicit, clearly labelled opt-in.
    return { requested: "india", warn: null };
  }
  if (raw === "spot" || raw === "gold-api" || raw === "keyless") {
    return { requested: "spot", warn: null };
  }
  if (raw === "india" || raw === "mcx" || raw === "ibja") {
    return { requested: "india", warn: null };
  }
  if (raw === "metalcharts" || raw === "metalcharts.org" || raw === "metal-charts") {
    return { requested: "metalcharts", warn: null };
  }
  if (raw === "manual") return { requested: "manual", warn: null };
  if (raw === "external") return { requested: "external", warn: null };
  // The automatic daily feed. Both spellings are accepted so an owner who reads
  // "metals.dev" in the docs does not have to guess the variable value.
  if (raw === "metalsdev" || raw === "metals-dev" || raw === "metals.dev") {
    return { requested: "metalsdev", warn: null };
  }
  return {
    requested: "manual",
    warn:
      `RATE_PROVIDER="${raw}" is not a known value, so the manual provider is in use. ` +
      'Use "india", "metalcharts", "metalsdev", "spot", "manual" or "external".',
  };
}

/* -------------------------------------------------------------------------- */
/* Manual provider                                                             */
/* -------------------------------------------------------------------------- */

const manualProvider: RateProvider = {
  kind: "manual",
  sourceName: MANUAL_SOURCE_NAME,
  label: "Manual entry — Entered by Tulsi Jewellers (IBJA benchmark)",
  note:
    "The showroom records each published AM/PM benchmark in the admin panel. Values are stored " +
    "with their date, time, session and GST status, and are never generated automatically.",
  publication: "manual",
  refreshMinutes: null,
  isConfigured: () => true,
  fetchLatest: async () => {
    throw new Error(
      "The manual provider has no remote feed. Record the published benchmark in the admin panel " +
        "or set RATE_PROVIDER=external with RATE_API_URL and RATE_API_KEY.",
    );
  },
};

/* -------------------------------------------------------------------------- */
/* External provider — thin wrapper around one mapper                           */
/* -------------------------------------------------------------------------- */

function externalProvider(mapper: RateMapper, config: ProviderConfig): RateProvider {
  return {
    kind: "external",
    sourceName: mapper.sourceName,
    label: mapper.label,
    note: mapper.note,
    publication: mapper.publication,
    refreshMinutes: mapper.refreshMinutes,
    isConfigured: () => hasApiKey(config.apiKey) && Boolean(config.apiUrl.trim()),
    fetchLatest: async () => {
      // Belt and braces: this module is server-only, but a request built in a
      // browser would expose the key, so refuse outright rather than risk it.
      if (typeof window !== "undefined") {
        throw new Error("A rate provider may only be called from the server.");
      }
      if (!hasApiKey(config.apiKey)) {
        throw new Error("RATE_API_KEY is not set, so the scheduled feed cannot run.");
      }
      if (!config.apiUrl.trim()) {
        throw new Error("RATE_API_URL is not set, so the scheduled feed cannot run.");
      }

      const { url, headers } = mapper.request(config);
      const response = await fetch(url, {
        headers,
        // A scheduled job, never a user request: no Next.js fetch cache.
        cache: "no-store",
        // The key stays in the query string/header; a redirect would carry it to
        // another host, so redirects are not followed.
        redirect: "error",
      });
      if (!response.ok) {
        // Provider error bodies can echo the request URL, so only the status is
        // reported here. Never the URL, never the key.
        throw new Error(`The rate provider responded with HTTP ${response.status}.`);
      }
      const payload: unknown = await response.json();
      return mapper.map(payload, config);
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Resolution                                                                  */
/* -------------------------------------------------------------------------- */

export type ProviderResolution = {
  requested: "manual" | "external" | "metalsdev" | "metalcharts" | "spot" | "india";
  active: RateProvider;
  /** Non-null when the requested provider could not be honoured. */
  problem: string | null;
  mapper: RateMapper | null;
  mapperId: string | null;
};

/**
 * Decide which provider is active, and say why when the requested one is not.
 * Callers that only need the provider use `activeProvider()`.
 */
export function resolveProvider(): ProviderResolution {
  const config = readConfig();
  const { requested, warn } = requestedProvider();

  if (requested === "manual") {
    return { requested, active: manualProvider, problem: warn, mapper: null, mapperId: null };
  }

  // The key-less automatic feed: real market data with no signup, so a new
  // installation still shows today's rupee rates.
  if (requested === "spot") {
    return { requested, active: spotProvider, problem: null, mapper: null, mapperId: "spot" };
  }

  // The Indian benchmark: the default, and the only basis a Nagpur showroom
  // should publish. When its file has no verified figure the provider stays
  // active but inactive, so the page says "being updated" instead of quietly
  // substituting an international number.
  if (requested === "india") {
    if (!indiaProvider.isConfigured()) {
      return {
        requested,
        active: indiaProvider,
        problem:
          "No verified Indian benchmark is configured, so no rate is being published. Add the " +
          "showroom's 24K per-10-gram and silver per-kg figures to content/rates/india-benchmark.json.",
        mapper: null,
        mapperId: "india",
      };
    }
    return { requested, active: indiaProvider, problem: null, mapper: null, mapperId: "india" };
  }

  // MetalCharts is the preferred automatic feed (USD/toz spot + daily FX).
  if (requested === "metalcharts") {
    if (!metalChartsProvider.isConfigured()) {
      return {
        requested,
        active: manualProvider,
        problem:
          "RATE_PROVIDER=metalcharts is set but RATE_API_KEY is missing, so the automatic feed is " +
          "off and the showroom's entered rates are being shown instead. Add the key to .env.local " +
          "(and to the Vercel + GitHub secrets) to switch it on.",
        mapper: null,
        mapperId: "metalcharts",
      };
    }
    return { requested, active: metalChartsProvider, problem: null, mapper: null, mapperId: "metalcharts" };
  }

  // The older named daily feed: one provider file, one request, derived purities.
  if (requested === "metalsdev") {
    if (!metalsDevProvider.isConfigured()) {
      return {
        requested,
        active: manualProvider,
        problem:
          "RATE_PROVIDER=metalsdev is set but METALS_DEV_API_KEY is missing, so the automatic " +
          "feed is off and the showroom's entered rates are being shown instead.",
        mapper: null,
        mapperId: "metalsdev",
      };
    }
    return { requested, active: metalsDevProvider, problem: null, mapper: null, mapperId: "metalsdev" };
  }

  const resolution = resolveMapper(config);
  if (!resolution.ok) {
    return { requested, active: manualProvider, problem: resolution.reason, mapper: null, mapperId: null };
  }

  const provider = externalProvider(resolution.mapper, config);
  const missing: string[] = [];
  if (!hasApiKey(config.apiKey)) missing.push("RATE_API_KEY");
  if (!config.apiUrl.trim()) missing.push("RATE_API_URL");
  if (missing.length > 0) {
    return {
      requested,
      active: manualProvider,
      problem: `RATE_PROVIDER=external is set but ${missing.join(" and ")} ${
        missing.length === 1 ? "is" : "are"
      } missing, so the showroom's entered rates are being shown instead.`,
      mapper: resolution.mapper,
      mapperId: resolution.mapper.id,
    };
  }

  return { requested, active: provider, problem: null, mapper: resolution.mapper, mapperId: resolution.mapper.id };
}

/** The provider the ingest job and the UI label use. */
export function activeProvider(): RateProvider {
  return resolveProvider().active;
}

/* -------------------------------------------------------------------------- */
/* Status for the admin panel                                                  */
/* -------------------------------------------------------------------------- */

export function providerStatuses(): ProviderStatus[] {
  const resolution = resolveProvider();
  const config = readConfig();
  const statuses: ProviderStatus[] = [
    {
      kind: resolution.active.kind,
      label: resolution.active.label,
      configured: resolution.active.isConfigured(),
      note: resolution.active.note,
      publication: resolution.active.publication,
      refreshMinutes: resolution.active.refreshMinutes,
      endpointHost:
        resolution.mapperId === "metalsdev"
          ? METALS_DEV_HOST
          : resolution.mapperId === "metalcharts"
            ? METALCHARTS_HOST
            : resolution.mapperId === "spot"
              ? SPOT_HOST
              : resolution.mapperId === "india"
                ? null
                : resolution.mapperId
                  ? endpointHost(config.apiUrl)
                  : null,
      hasKey:
        resolution.mapperId === "metalsdev"
          ? metalsDevProvider.isConfigured()
          : resolution.mapperId === "metalcharts"
            ? metalChartsProvider.isConfigured()
            : resolution.mapperId === "spot"
              ? true
              : resolution.mapperId === "india"
                ? indiaProvider.isConfigured()
                : hasApiKey(config.apiKey),
      assumptions: resolution.mapper ? [...resolution.mapper.assumptions] : [],
    },
  ];

  // The fallback is always listed, because it is what runs when the feed fails
  // and it is what the customer sees in that case.
  if (resolution.active.kind !== "manual") {
    statuses.push({
      kind: "manual",
      label: manualProvider.label,
      configured: true,
      note: manualProvider.note,
      publication: "manual",
      refreshMinutes: null,
      endpointHost: null,
      hasKey: false,
      assumptions: [],
    });
  }

  return statuses;
}

/** Every mapper id this build knows, for the admin card and the docs. */
export const SUPPORTED_MAPPER_IDS: readonly string[] = MAPPERS.map((mapper) => mapper.id);

/* -------------------------------------------------------------------------- */
/* Allowed series                                                              */
/* -------------------------------------------------------------------------- */

/** Curated list the ingest job is allowed to store; anything else is rejected. */
export const EXPECTED_SERIES: ReadonlyArray<{
  metal: "gold" | "silver";
  purity: string;
  unit: RateObservation["unit"];
}> = [
  { metal: "gold", purity: "999", unit: "INR_PER_10_GRAM" },
  { metal: "gold", purity: "916", unit: "INR_PER_10_GRAM" },
  { metal: "gold", purity: "833", unit: "INR_PER_10_GRAM" },
  { metal: "gold", purity: "750", unit: "INR_PER_10_GRAM" },
  { metal: "gold", purity: "585", unit: "INR_PER_10_GRAM" },
  { metal: "silver", purity: "999", unit: "INR_PER_KG" },
];
