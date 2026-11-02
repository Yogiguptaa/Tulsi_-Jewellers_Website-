/**
 * festivals/service.ts — the only thing a page calls. SERVER-ONLY.
 *
 * The date is decided here, in Asia/Kolkata, and cached for minutes: a countdown
 * that lags by an hour is harmless, a countdown that lags by a day is not. No
 * network call is involved, so the strip cannot fail because a provider is down,
 * and a build never depends on one either.
 */

import { cacheLife } from "next/cache";
import { FESTIVALS } from "./data";
import { formatFestivalDate, istDate, selectFestival, type FestivalPhase } from "./select";
import type { FestivalCategory, FestivalText } from "./types";

export type FestivalStripData = {
  slug: string;
  name: FestivalText;
  headline: FestivalText;
  subline: FestivalText;
  categories: FestivalCategory[];
  phase: FestivalPhase;
  daysUntil: number;
  /** The festival's first day, already formatted for both languages. */
  dateLabel: FestivalText;
};

export async function getFestivalStripData(): Promise<FestivalStripData | null> {
  "use cache";
  cacheLife("minutes");

  const choice = selectFestival(FESTIVALS, istDate(new Date()));
  if (!choice) return null;

  const { festival, phase, daysUntil } = choice;

  return {
    slug: festival.slug,
    name: festival.name,
    headline: festival.headline,
    subline: festival.subline,
    categories: festival.categories,
    phase,
    daysUntil,
    dateLabel: {
      en: formatFestivalDate(festival.dateStart, "en"),
      hi: formatFestivalDate(festival.dateStart, "hi"),
    },
  };
}

/** Days until the next verified festival, for the health check. Null when none is ahead. */
export async function getNextFestivalGap(): Promise<number | null> {
  const today = istDate(new Date());
  const upcoming = FESTIVALS.filter((festival) => festival.verified && festival.dateStart >= today);
  if (upcoming.length === 0) return null;
  const next = upcoming.reduce((earliest, festival) =>
    festival.dateStart < earliest.dateStart ? festival : earliest,
  );
  return Math.round((Date.parse(`${next.dateStart}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}
