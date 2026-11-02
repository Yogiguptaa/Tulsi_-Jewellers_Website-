/**
 * festivals/types.ts — the shape of one festival entry.
 *
 * A date is a plain calendar date in Asia/Kolkata (the showroom's clock), not an
 * instant: a festival belongs to a day, and storing it as an instant invites the
 * classic off-by-one where 6 November in India is still 5 November in UTC.
 *
 * `verified` is the gate that keeps a wrong date off the site. An entry is only
 * ever rendered when it is verified AND it carries at least two independent
 * sources that agree (checked by `festivals/data.test.ts` and by
 * `scripts/check-festivals.mjs`).
 */

export type FestivalLang = "en" | "hi";

export type FestivalText = { en: string; hi: string };

export type FestivalSource = {
  /** Who published the date, e.g. "Drik Panchang". */
  label: string;
  /** The page that was actually read. */
  url: string;
};

export type FestivalCategory = {
  label: FestivalText;
  /** An existing route; the festival strip never invents a collection. */
  href: string;
};

export type Festival = {
  slug: string;
  name: FestivalText;
  /** First day, inclusive — `YYYY-MM-DD` in Asia/Kolkata. */
  dateStart: string;
  /** Last day, inclusive. Equal to `dateStart` for a one-day festival. */
  dateEnd: string;
  /** How many days before `dateStart` the strip may appear. */
  leadDays: number;
  /** How many days after `dateEnd` a greeting may stay up. */
  trailDays: number;
  /** Higher wins when two windows overlap (Dhanteras outranks Diwali). */
  priority: number;
  /** Only a verified entry is ever shown. */
  verified: boolean;
  /** At least two independent sources once `verified` is true. */
  sources: FestivalSource[];
  /** One factual line. No offers, no discounts, no urgency. */
  headline: FestivalText;
  subline: FestivalText;
  categories: FestivalCategory[];
};
