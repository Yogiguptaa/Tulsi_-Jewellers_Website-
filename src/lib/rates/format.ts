/**
 * rates/format.ts — display helpers.
 *
 * Rules: never render ₹0 or a bare dash as if it were a rate; when a value is
 * missing the caller shows an explicit "unavailable" message instead.
 */

import type { RateObservation, RateStatusKind } from "./types";

/** Whole-rupee Indian grouping: 98760 → "98,760". */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value));
}

/** Unit suffix shown next to a value. */
export function unitLabel(unit: RateObservation["unit"]): string {
  return unit === "INR_PER_10_GRAM" ? "/ 10 g" : "/ kg";
}

/** "₹ 98,760 / 10 g" — null when there is no real value. */
export function formatRate(rate: number | null, unit: RateObservation["unit"]): string | null {
  if (rate === null || !Number.isFinite(rate) || rate <= 0) return null;
  return `₹ ${formatINR(rate)} ${unitLabel(unit)}`;
}

export function formatDelta(abs: number | null, pct: number | null): string | null {
  if (abs === null || pct === null) return null;
  if (abs === 0) return "no change";
  const sign = abs > 0 ? "+" : "−";
  return `${sign}₹ ${formatINR(Math.abs(abs))} (${sign}${Math.abs(pct).toFixed(2)}%)`;
}

export function deltaDirection(abs: number | null): "up" | "down" | "flat" | null {
  if (abs === null) return null;
  if (abs > 0) return "up";
  if (abs < 0) return "down";
  return "flat";
}

/** Session wording that never overstates what the source publishes. */
export function sessionLabel(session: RateObservation["session"], lang: "en" | "hi"): string {
  if (session === "AM") return lang === "hi" ? "सुबह (AM)" : "Morning (AM)";
  if (session === "PM") return lang === "hi" ? "शाम (PM)" : "Evening (PM)";
  return lang === "hi" ? "सत्र घोषित नहीं" : "Session not stated";
}

/** Readable age, e.g. "12 minutes ago" / "2 days ago". */
export function ageLabel(iso: string | null, now: number, lang: "en" | "hi" = "en"): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;

  const pick = (en: string, hi: string) => (lang === "hi" ? hi : en);

  if (seconds < 90) return pick("just now", "अभी");
  if (seconds < hour) {
    const value = Math.round(seconds / minute);
    return pick(`${value} minutes ago`, `${value} मिनट पहले`);
  }
  if (seconds < day) {
    const value = Math.round(seconds / hour);
    return pick(`${value} hours ago`, `${value} घंटे पहले`);
  }
  const value = Math.round(seconds / day);
  return pick(`${value} day${value === 1 ? "" : "s"} ago`, `${value} दिन पहले`);
}

/** Full date + time for the "as on" line. */
export function formatDateTime(iso: string | null, lang: "en" | "hi" = "en"): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatDate(iso: string, lang: "en" | "hi" = "en"): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export const STATUS_LABEL: Record<RateStatusKind, { en: string; hi: string; tone: string }> = {
  // "Live" is earned, not decorative: only a feed that genuinely updates through
  // the day and whose newest value is minutes old may use this label.
  live: { en: "Live rate", hi: "लाइव भाव", tone: "text-emerald-600" },
  updated: { en: "Latest published rate", hi: "नवीनतम प्रकाशित भाव", tone: "text-emerald-600" },
  market_closed: { en: "Market closed — last published rate", hi: "बाज़ार बंद — अंतिम प्रकाशित भाव", tone: "text-charcoal/70" },
  stale: { en: "Data not updated recently", hi: "डेटा हाल में अपडेट नहीं हुआ", tone: "text-maroon" },
  unavailable: { en: "Rate unavailable", hi: "भाव उपलब्ध नहीं", tone: "text-maroon" },
};
