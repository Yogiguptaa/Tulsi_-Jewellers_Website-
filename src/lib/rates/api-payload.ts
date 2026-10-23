/**
 * rates/api-payload.ts — the JSON shape the browser receives for rates.
 *
 * One definition, used by `/api/rates/latest` and by the home page (which hands
 * its first snapshot to the ticker as initial data). The ticker therefore paints
 * a real rate with the HTML instead of a "loading" strip, and the polled JSON has
 * exactly the same shape as the server-rendered one.
 */

import type { RatesSnapshot } from "./types";

export type ApiRateLine = {
  id: string;
  metal: "gold" | "silver";
  purityLabel: string;
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
  /** Per 10 g for gold and per kg for silver; the per-gram figure is derived in the UI. */
  rate: number | null;
  observedAt: string | null;
  session: string | null;
  makingChargesIncluded: boolean | null;
  source: string | null;
  deltaAbs: number | null;
  deltaPct: number | null;
};

export type ApiRatesPayload = {
  status: RatesSnapshot["status"];
  providerLabel: string;
  sources: { name: string; observedAt: string | null; isManual: boolean }[];
  intraday: boolean;
  spotConverted: boolean;
  customerNote: string | null;
  asOf: string | null;
  isConfigured: boolean;
  notice: string | null;
  lines: ApiRateLine[];
};

export function toApiPayload(snapshot: RatesSnapshot): ApiRatesPayload {
  return {
    status: snapshot.status,
    providerLabel: snapshot.providerLabel,
    sources: snapshot.sources,
    intraday: snapshot.intraday,
    spotConverted: snapshot.spotConverted,
    customerNote: snapshot.customerNote,
    asOf: snapshot.asOf,
    isConfigured: snapshot.isConfigured,
    notice: snapshot.notice,
    lines: snapshot.lines.map((line) => ({
      id: line.row.id,
      metal: line.row.metal,
      purityLabel: line.row.purityLabel,
      unit: line.row.unit,
      rate: line.latest?.rate ?? null,
      observedAt: line.latest?.observedAt ?? null,
      session: line.latest?.session ?? null,
      makingChargesIncluded: line.latest?.makingChargesIncluded ?? null,
      source: line.latest?.source ?? null,
      deltaAbs: line.deltaAbs,
      deltaPct: line.deltaPct,
    })),
  };
}
