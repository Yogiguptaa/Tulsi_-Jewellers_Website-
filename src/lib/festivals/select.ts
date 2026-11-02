/**
 * festivals/select.ts — pure date arithmetic and selection. No I/O, no clock of
 * its own: the caller passes "today", which makes every rule testable at any
 * date (the day before a lead window, the last minute of the festival, the day
 * after it, 29 February).
 *
 * Calendar dates are handled as `YYYY-MM-DD` strings and converted to UTC
 * midnights for arithmetic. UTC has no daylight-saving jumps, so adding a day is
 * always exactly 86,400,000 ms — the bug that bites naive local-date maths.
 */

import type { Festival, FestivalText } from "./types";

export type FestivalPhase = "upcoming" | "today" | "justPassed";

export type FestivalSelection = {
  festival: Festival;
  phase: FestivalPhase;
  /** 0 on the day, 1 tomorrow, 4 in four days. Never negative. */
  daysUntil: number;
  /** Inclusive window the strip is allowed to appear in. */
  windowStart: string;
  windowEnd: string;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse `YYYY-MM-DD` to a UTC midnight, or null. */
export function isoToUtc(iso: string): number | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [, year, month, day] = match;
  const stamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const date = new Date(stamp);
  // Reject 2026-02-30 and friends instead of silently rolling into March.
  if (date.getUTCFullYear() !== Number(year)) return null;
  if (date.getUTCMonth() !== Number(month) - 1) return null;
  if (date.getUTCDate() !== Number(day)) return null;
  return stamp;
}

/** UTC midnight back to `YYYY-MM-DD`. */
export function utcToIso(stamp: number): string {
  return new Date(stamp).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const stamp = isoToUtc(iso);
  if (stamp === null) throw new Error(`Not a calendar date: ${iso}`);
  return utcToIso(stamp + days * 86_400_000);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const a = isoToUtc(from);
  const b = isoToUtc(to);
  if (a === null || b === null) throw new Error(`Not a calendar date: ${from} → ${to}`);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Today's date in Asia/Kolkata, whatever clock the server runs on. A server in
 * UTC would otherwise roll over five and a half hours late, which is exactly when
 * a festival greeting matters.
 */
export function istDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function windowOf(festival: Festival): { start: string; end: string } {
  return {
    start: addDays(festival.dateStart, -Math.max(0, festival.leadDays)),
    end: addDays(festival.dateEnd, Math.max(0, festival.trailDays)),
  };
}

/**
 * Pick the festival to show today, or null so the strip renders nothing at all —
 * an empty bar is worse than no bar.
 *
 * Order of preference:
 *   1. A festival happening today (the greeting), highest priority first.
 *   2. The nearest upcoming festival whose lead window is open.
 *   3. A festival that ended within its trail days (the greeting, without a date,
 *      because a past date must never be displayed).
 */
export function selectFestival(
  festivals: readonly Festival[],
  today: string,
): FestivalSelection | null {
  if (isoToUtc(today) === null) return null;

  const candidates: FestivalSelection[] = [];

  for (const festival of festivals) {
    if (!festival.verified) continue;
    if (festival.dateStart > festival.dateEnd) continue;

    const { start, end } = windowOf(festival);
    if (today < start || today > end) continue;

    const phase: FestivalPhase =
      today < festival.dateStart ? "upcoming" : today > festival.dateEnd ? "justPassed" : "today";

    candidates.push({
      festival,
      phase,
      daysUntil: Math.max(0, daysBetween(today, festival.dateStart)),
      windowStart: start,
      windowEnd: end,
    });
  }

  const rank: Record<FestivalPhase, number> = { today: 0, upcoming: 1, justPassed: 2 };

  candidates.sort((a, b) => {
    if (rank[a.phase] !== rank[b.phase]) return rank[a.phase] - rank[b.phase];
    if (a.phase === "justPassed") {
      // The most recently finished festival is the relevant one.
      if (a.festival.dateEnd !== b.festival.dateEnd) {
        return a.festival.dateEnd < b.festival.dateEnd ? 1 : -1;
      }
    } else if (a.daysUntil !== b.daysUntil) {
      return a.daysUntil - b.daysUntil;
    }
    if (a.festival.priority !== b.festival.priority) {
      return b.festival.priority - a.festival.priority;
    }
    return a.festival.slug.localeCompare(b.festival.slug);
  });

  return candidates[0] ?? null;
}

/** "Friday 6 November" — a weekday and date a customer can act on. */
export function formatFestivalDate(iso: string, lang: "en" | "hi"): string {
  const stamp = isoToUtc(iso);
  if (stamp === null) return iso;
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(stamp));
}

export function textFor(text: FestivalText, lang: "en" | "hi"): string {
  return lang === "hi" ? text.hi : text.en;
}
