"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Photo from "@/components/catalogue/Photo";
import type { CatalogueImage } from "@/lib/catalogue/images";

export type GalleryImage = {
  image: CatalogueImage;
  /** Attribution for a stock photograph, or null for owner-supplied photos. */
  credit: string | null;
};

/**
 * Single-item gallery: one large frame on the left, <=5 thumbnails under it.
 * Arrow keys move between photos, and the counter is announced politely so a
 * screen-reader user knows the frame changed.
 */
export default function ProductGallery({
  images,
  alt,
  label,
}: {
  images: GalleryImage[];
  alt: string;
  /** e.g. "Photo 2 of 3" — already translated by the caller. */
  label: (index: number, total: number) => string;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;

  if (total === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center border border-gold/25 bg-champagne/25 text-sm text-charcoal/70">
        {alt}
      </div>
    );
  }

  const current = images[Math.min(index, total - 1)];
  const move = (delta: number) => setIndex((current2) => (current2 + delta + total) % total);

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden border border-gold/25 bg-gradient-to-br from-ivory via-champagne/40 to-gold-100"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={alt}
      >
        <Photo
          image={current.image}
          alt={alt}
          sizes="(min-width: 1024px) 45vw, 92vw"
          lcp
          className={`h-full w-full object-cover ${total > 1 ? "cursor-ew-resize" : ""}`}
        />

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gold/50 bg-offwhite/90 text-maroon hover:bg-champagne"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gold/50 bg-offwhite/90 text-maroon hover:bg-champagne"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      <p className="text-xs text-charcoal/70" aria-live="polite">
        {label(index + 1, total)}
        {current.credit ? ` · ${current.credit}` : ""}
      </p>

      {total > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((image, thumbIndex) => (
            <li key={`${image.image.src}-${thumbIndex}`}>
              <button
                type="button"
                onClick={() => setIndex(thumbIndex)}
                aria-current={thumbIndex === index}
                aria-label={`${alt} — ${label(thumbIndex + 1, total)}`}
                className={`block h-16 w-16 overflow-hidden border ${
                  thumbIndex === index ? "border-maroon" : "border-gold/35 hover:border-maroon/60"
                }`}
              >
                <Photo image={image.image} alt="" sizes="64px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
