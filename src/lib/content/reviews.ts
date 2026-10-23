/**
 * content/reviews.ts — customer reviews.
 *
 * The site publishes no review it did not receive: there are no sample entries,
 * no seeded text and no fallback path. The home page hides the reviews block
 * entirely while the list is empty, and a review appears only after the owner
 * approves a genuine submission in /admin (Reviews).
 */

export type Review = {
  id: string;
  author: string;
  /** Only real reviews may carry a rating; a missing rating stays null. */
  rating: number | null;
  body: { en: string; hi: string };
};
