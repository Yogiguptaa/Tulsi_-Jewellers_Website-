"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES, pick, whatsappHref, type LocalizedText } from "@/lib/config";
import { imageFor } from "@/lib/catalogue/images";
import Photo from "@/components/catalogue/Photo";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * "Trending styles" — an editorial strip of STYLE INSPIRATION, not inventory.
 *
 * Every tile says so in the heading and in its own caption, links to the type
 * page rather than a product page, and never carries a price or a stock claim.
 * The photographs are freely licensed stock (see /image-credits and
 * public/images/CREDITS.md); the owner replaces them with the showroom's own
 * photographs, and the strip keeps working with the same keys.
 */
type Style = {
  key: string;
  label: LocalizedText;
  href: string;
  /** Sent to WhatsApp so the reply can be about this style. */
  enquiry: string;
};

const STYLES: Style[] = [
  {
    key: "kadaMeenakari",
    label: { en: "Enamel kadas", hi: "मीनाकारी कड़े" },
    href: `${ROUTES.collections}/gold-jewellery`,
    enquiry: "gold bangles",
  },
  {
    key: "goldNecklaceAncient",
    label: { en: "Necklaces", hi: "हार" },
    href: "/jewellery/necklaces",
    enquiry: "a necklace",
  },
  {
    key: "ringDiamond",
    label: { en: "Diamond rings", hi: "डायमंड अंगूठियाँ" },
    href: "/jewellery/rings",
    enquiry: "a diamond ring",
  },
  {
    key: "earringsGold",
    label: { en: "Earrings", hi: "कान के झुमके" },
    href: "/jewellery/earrings",
    enquiry: "earrings",
  },
  {
    key: "silverDisplay",
    label: { en: "Silver", hi: "चांदी" },
    href: `${ROUTES.collections}/silver-jewellery`,
    enquiry: "silver pieces",
  },
  {
    key: "rubyRing",
    label: { en: "Gemstone pieces", hi: "रत्न के गहने" },
    href: ROUTES.gems,
    enquiry: "a gemstone piece",
  },
];

export default function TrendingStyles() {
  const { lang, t } = useLanguage();

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
          href={ROUTES.collections}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon underline-offset-4 hover:underline"
        >
          {t("common.showAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STYLES.map((style) => {
          const wa = whatsappHref(
            `Hello Tulsi Jewellers, I like this style: ${style.enquiry}. Do you have similar designs?`,
          );
          return (
            <li key={style.key} className="group">
              <Link
                href={style.href}
                className="block overflow-hidden border border-gold/25 bg-offwhite"
              >
                <span className="relative block aspect-[4/5] overflow-hidden bg-champagne/25">
                  <Photo
                    image={imageFor(style.key)}
                    alt=""
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </span>
                <span className="block px-3 py-2 text-xs font-medium text-charcoal">
                  {pick(style.label, lang)}
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
