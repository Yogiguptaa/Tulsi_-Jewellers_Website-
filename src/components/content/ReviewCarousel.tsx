"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { pick } from "@/lib/config";
import type { Review } from "@/lib/content/reviews";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Review carousel.
 *
 * `reviews` are genuine, owner-approved rows from the `reviews` table, supplied
 * by the home page. With none, the component renders nothing — there is no
 * sample, seeded or invented review path in the code. A rating appears only when
 * the reviewer's own rating was recorded.
 */
export default function ReviewCarousel({ reviews }: { reviews?: Review[] | null }) {
  const { lang, t } = useLanguage();
  const [index, setIndex] = useState(0);

  const list: Review[] = reviews ?? [];
  const total = list.length;

  const move = useCallback(
    (delta: number) => setIndex((current) => (current + delta + total) % total),
    [total],
  );

  if (total === 0) return null;

  const review = list[index % total];

  return (
    <div className="relative border border-gold/25 bg-offwhite p-6 sm:p-8">
      <Quote className="h-6 w-6 text-gold-700" aria-hidden="true" />
      <blockquote className="mt-3 min-h-24 text-base italic leading-relaxed text-charcoal/80">
        {pick(review.body, lang)}
      </blockquote>
      <p className="mt-4 font-mono text-xs text-charcoal/70">
        {review.author}
        {review.rating !== null ? (
          <span className="ml-2 text-gold-700" aria-label={`${review.rating} out of 5`}>
            {"★".repeat(review.rating)}
            <span className="text-charcoal/20">{"★".repeat(Math.max(0, 5 - review.rating))}</span>
          </span>
        ) : null}
      </p>

      {total > 1 ? (
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={t("common.back")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-maroon hover:bg-champagne/60"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={t("common.next")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-maroon hover:bg-champagne/60"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="ml-1 text-xs text-charcoal/70" aria-live="polite">
            {index + 1} / {total}
          </span>
        </div>
      ) : null}
    </div>
  );
}
