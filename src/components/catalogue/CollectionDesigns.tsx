"use client";

/**
 * components/catalogue/CollectionDesigns.tsx — the design wall on a collection
 * page.
 *
 * WHY THIS EXISTS
 * ───────────────
 * A collection page used to open with a catalogue browser and, when no product
 * rows existed yet, a single line saying new designs were arriving. A visitor who
 * clicked "Gold Jewellery" therefore saw an empty page. This strip fills that gap
 * honestly: it shows the styles the showroom works in, several photographs per
 * style, and says in words that the photographs show a style rather than an item
 * held in stock.
 *
 * NO REPEATS
 * ──────────
 * `designPhotosForCollection()` already removes any photograph used by an earlier
 * style in the same collection, so every tile here is a different picture. The
 * caller passes that list; this component only decides the layout and how many
 * are visible at once (eight, then eight more per press).
 *
 * VIDEO
 * ─────
 * If a manifest entry is a video, the tile plays it muted and inline with the
 * recorded poster. Nothing here hardcodes a video that does not exist.
 */

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MessageCircle, Play } from "lucide-react";
import { ROUTES, pick, whatsappHref } from "@/lib/config";
import { assetForKey, imageAlt, imageFor } from "@/lib/catalogue/images";
import type { DesignPhoto } from "@/lib/designs";
import Photo from "@/components/catalogue/Photo";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { buttonClasses } from "@/components/ui/Button";

const STEP = 8;

export default function CollectionDesigns({ photos }: { photos: DesignPhoto[] }) {
  const { lang, t } = useLanguage();
  const [visible, setVisible] = useState(STEP);

  if (photos.length === 0) return null;

  const shown = photos.slice(0, visible);
  const remaining = photos.length - shown.length;
  const waHref = whatsappHref(
    "Hello Tulsi Jewellers, I am looking at the designs on your website. What is available in the showroom today?",
  );

  return (
    <section className="space-y-5" aria-labelledby="collection-designs-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-700">
            {t("designStyles.kicker")}
          </p>
          <h2
            id="collection-designs-title"
            className="mt-1 font-[family-name:var(--font-display)] text-2xl text-maroon sm:text-3xl"
          >
            {t("designStyles.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-charcoal/70">
            {t("designStyles.note")}
          </p>
        </div>
        <p className="text-xs text-charcoal/60">
          {t("designStyles.count", { count: photos.length })}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((photo, index) => {
          const asset = assetForKey(photo.key);
          const isVideo = asset?.kind === "video";
          const featured = index === 0;
          return (
            <li
              key={photo.key}
              className={featured ? "col-span-2 row-span-2" : undefined}
            >
              <Link
                href={`${ROUTES.designs}/${photo.slug}`}
                className="group flex h-full flex-col overflow-hidden border border-gold/25 bg-offwhite transition-colors hover:border-maroon/40"
              >
                <span
                  className={`relative block overflow-hidden bg-champagne/25 ${
                    featured ? "aspect-[4/3] sm:aspect-[16/11]" : "aspect-[4/5]"
                  }`}
                >
                  {isVideo && asset ? (
                    <>
                      <video
                        src={asset.src}
                        poster={asset.poster}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#160f08]/70 px-2 py-1 text-[10px] font-medium text-cream">
                        <Play className="h-3 w-3" aria-hidden="true" />
                        {t("designStyles.video")}
                      </span>
                    </>
                  ) : (
                    <Photo
                      image={imageFor(photo.key)}
                      alt={pick(imageAlt(photo.key, photo.name), lang)}
                      sizes={
                        featured
                          ? "(min-width: 1024px) 46vw, (min-width: 640px) 60vw, 92vw"
                          : "(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw"
                      }
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </span>
                <span className="flex flex-1 items-center justify-between gap-2 border-t border-gold/15 px-3 py-2">
                  <span className="text-xs font-medium leading-snug text-charcoal sm:text-sm">
                    {pick(photo.name, lang)}
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-maroon transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => setVisible((count) => count + STEP)}
            className={buttonClasses("secondary", "md")}
          >
            {t("designStyles.more", { count: remaining })}
          </button>
        ) : (
          <p className="text-xs text-charcoal/60">{t("designStyles.allShown")}</p>
        )}
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("ghost", "md")}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("designStyles.ask")}
          </a>
        ) : null}
      </div>
    </section>
  );
}
