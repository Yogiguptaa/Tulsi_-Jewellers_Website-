"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES, pick, whatsappHref } from "@/lib/config";
import { imageAlt, imageFor } from "@/lib/catalogue/images";
import { designsWithPhotos } from "@/lib/designs";
import Photo from "@/components/catalogue/Photo";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * "Popular designs" — a strip of STYLE, not inventory.
 *
 * The tiles come from `lib/designs.ts`, the same data the /designs pages use, so
 * a style's name, picture and enquiry never disagree between the home page and
 * its own page. Every tile links to that style's page rather than pretending to
 * be a product, and never carries a price or a stock claim.
 */
export default function TrendingStyles() {
  const { lang, t } = useLanguage();
  const styles = designsWithPhotos(6);

  return (
    <section className="container-page py-12 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-700">
            {t("home.trendingKicker")}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-maroon sm:text-3xl">
            {t("home.trendingTitle")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-charcoal/70">{t("home.trendingNote")}</p>
        </div>
        <Link
          href={ROUTES.designs}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon underline-offset-4 hover:underline"
        >
          {t("home.designsSeeAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {styles.map((style) => {
          const key = style.images[0];
          const wa = whatsappHref(
            `Hello Tulsi Jewellers, I like this style: ${style.enquiry}. Do you have similar designs?`,
          );
          return (
            <li key={style.slug} className="group">
              <Link
                href={`${ROUTES.designs}/${style.slug}`}
                className="block overflow-hidden border border-gold/25 bg-offwhite"
              >
                <span className="relative block aspect-[4/5] overflow-hidden bg-champagne/25">
                  <Photo
                    image={imageFor(key)}
                    alt={pick(imageAlt(key, style.name), lang)}
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </span>
                <span className="block px-3 py-2 text-xs font-medium text-charcoal">
                  {pick(style.name, lang)}
                </span>
              </Link>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block px-3 text-[11px] text-maroon underline-offset-2 hover:underline"
                >
                  {t("home.trendingAsk")}
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
