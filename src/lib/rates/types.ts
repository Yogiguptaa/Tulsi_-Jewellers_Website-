/**
 * rates/types.ts — domain types for the gold & silver rate system.
 *
 * Honesty contract enforced by these types:
 *  • a rate always carries `source`, `observedAt` and `session`
 *  • `gstIncluded` / `makingChargesIncluded` are explicit, never assumed
 *  • "unavailable" is a first-class status — the UI shows a labelled message
 *    and, if anything is shown at all, the last verified value with its date
 */

import type { RateRow } from "@/lib/config";

export type MarketSession = "AM" | "PM" | "unknown";

export type RateStatusKind =
  /** Provider is updating through the day (a real live feed). */
  | "live"
  /** A published benchmark for today has been recorded. */
  | "updated"
  /** Latest observation is from a previous business day. */
  | "market_closed"
  /** Latest observation is older than the staleness window. */
  | "stale"
  /** Nothing has ever been recorded, or the store is unreachable. */
  | "unavailable";

/** One raw observation, exactly as stored in `metal_rates`. */
export type RateObservation = {
  id: string;
  metal: "gold" | "silver";
  /** Fineness as stored: "999", "916", "833", "750", "585". */
  purity: string;
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
  rate: number;
  source: string;
  session: MarketSession;
  gstIncluded: boolean;
  makingChargesIncluded: boolean;
  /** When the market value was observed (ISO). */
  observedAt: string;
  /** When our job stored it (ISO). */
  fetchedAt: string;
};

export type RateLine = {
  /** Presentation row from config.RATE_ROWS (gold-999, silver-999, …). */
  row: RateRow;
  latest: RateObservation | null;
  /** Previous distinct observation, used for the change indicator. */
  previous: RateObservation | null;
  deltaAbs: number | null;
  deltaPct: number | null;
};

/** Every distinct source currently behind the published values. */
export type RateSource = {
  /** Exactly as stored, e.g. "IBJA benchmark (via Metals.Dev)". */
  name: string;
  /** Newest observation from that source, ISO, or null. */
  observedAt: string | null;
  /** True when the rows came from the showroom's own entries. */
  isManual: boolean;
};

export type RatesSnapshot = {
  status: RateStatusKind;
  /** Human-readable source of the values, e.g. "Entered by Tulsi Jewellers". */
  providerLabel: string;
  /**
   * Which source each published line actually came from. A value is never
   * averaged or merged across sources; when a board shows values from more than
   * one source, every line is labelled and this list says so plainly.
   */
  sources: RateSource[];
  /**
   * True only when the active feed genuinely updates through the day. A
   * published benchmark keeps this false so the UI can never say "Live".
   */
  intraday: boolean;
  /**
   * True when the published values are international spot prices converted to
   * INR for the Indian purities, rather than a published IBJA/MCX benchmark. The
   * UI says so plainly and never labels such a value "benchmark".
   */
  spotConverted: boolean;
  /**
   * Mandatory customer-facing sentence for the active feed (for converted spot
   * prices, the "Indian market rates can differ" wording). Null when the values
   * are the showroom's own entries or a benchmark that needs no extra note.
   */
  customerNote: string | null;
  /** True when rates can actually be recorded (Supabase configured). */
  isConfigured: boolean;
  /** ISO time of the newest observation across all lines, or null. */
  asOf: string | null;
  /** ISO time this snapshot was assembled. */
  generatedAt: string;
  lines: RateLine[];
  /** Set when a problem should be surfaced (never a fake value). */
  notice: string | null;
};

/** Where a value came from, for the provider abstraction and the admin panel. */
export type ProviderKind = "manual" | "external";

export type ProviderStatus = {
  kind: ProviderKind;
  label: string;
  configured: boolean;
  /** Short explanation shown in the admin panel / rates page footer. */
  note: string;
  /** "published" sources may never be labelled "Live". */
  publication: "published" | "intraday" | "manual";
  /** How often the source changes, when known. Documents the cron schedule. */
  refreshMinutes: number | null;
  /** Host of the configured endpoint, never the full URL and never the key. */
  endpointHost: string | null;
  /** Whether an API key is present. The key itself is never exposed. */
  hasKey: boolean;
  /**
   * Mapping assumptions the owner must confirm before publish (for example which
   * fineness the provider's field really represents). Shown verbatim in admin.
   */
  assumptions: string[];
};
