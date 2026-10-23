"use client";

/**
 * BangleShowcase — the bangle room, as one composed picture rather than a row
 * of thumbnails.
 *
 * WHY A MOSAIC
 * ────────────
 * Bangles are the hardest thing to photograph on their own: a single ring on
 * white reads as a catalogue cut-out, and a row of them reads as a shop wall.
 * These four photographs are close, warm and materially different — enamel,
 * inlay, stone-set gold, a slim everyday band — so they are composed as a single
 * plate: one lead image with three supporting tiles. It reads as an edit of the
 * collection instead of a list of SKUs.
 *
 * WHAT IT IS NOT
 * ──────────────
 * It is not inventory. No price, no stock claim, no "add to cart": each tile
 * says what the style *is* and offers to ask the showroom about it. Every
 * photograph carries its licence in /image-credits and public/media/manifest.json.
 *
 * LAYOUT
 * ──────
 * Phones: lead image full width, second wide, third and fourth side by side.
 * `sm` and up: a four-column, two-row plate — lead 2×2, second 2×1, then one
 * cell each — which fills every cell exactly, with no gap left over.
 */

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ROUTES, pick, whatsappHref, type LocalizedText } from "@/lib/config";
import { imageAlt, imageFor } from "@/lib/catalogue/images";
import Photo from "@/components/catalogue/Photo";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { buttonClasses } from "@/components/ui/Button";

type Tile = {
  key: string;
  name: LocalizedText;
  note: LocalizedText;
  /** Sent to WhatsApp so the reply can be about this style. */
  enquiry: string;
  sizes: string;
};

const TILES: Tile[] = [
  {
    key: "kadaMeenakari",
    name: { en: "Meenakari kada", hi: "मीनाकारी कड़ा" },
    note: {
      en: "Green and red enamel inlaid into a solid gold band, the old Jaipur way.",
      hi: "ठोस सोने की पट्टी में हरी-लाल मीनाकारी — जयपुर का पुराना तरीका।",
    },
    enquiry: "a meenakari kada",
    sizes: "(min-width: 1024px) 48vw, (min-width: 640px) 60vw, 92vw",
  },
  {
    key: "bangleRubyDiamond",
    name: { en: "Ruby & diamond band", hi: "रूबी-हीरा कंगन" },
    note: {
      en: "One band, set stone by stone — the piece a wedding is remembered by.",
      hi: "एक पट्टी, एक-एक पत्थर जड़ा — शादी की याद बनने वाला गहना।",
    },
    enquiry: "a ruby and diamond bangle",
    sizes: "(min-width: 1024px) 48vw, (min-width: 640px) 60vw, 92vw",
  },
  {
    key: "bangleGoldEnamel",
    name: { en: "Slim enamel bangle", hi: "पतली मीनाकारी चूड़ी" },
    note: {
      en: "Light enough to wear every day, with a hand-painted enamel flower.",
      hi: "रोज़ पहनने लायक हल्की, हाथ से बना मीनाकारी फूल।",
    },
    enquiry: "a slim enamel bangle",
    sizes: "(min-width: 640px) 24vw, 46vw",
  },
  {
    key: "bangleBlueEnamel",
    name: { en: "Blue enamel bangle", hi: "नीली मीनाकारी कड़ा" },
    note: {
      en: "Birds and vines in blue and white, with fine gold granulation between.",
      hi: "नीले-सफ़ेद में पक्षी और बेल, बीच में बारीक सोने का दाना।",
    },
    enquiry: "a blue enamel bangle",
    sizes: "(min-width: 640px) 24vw, 46vw",
  },
];

export default function BangleShowcase() {
  const { lang, t } = useLanguage();
  const askHref = whatsappHref(
    "Hello Tulsi Jewellers, I saw the bangle collection on the website. What designs do you have in the showroom?",
  );

  return (
    <section className="border-y border-gold/20 bg-champagne/20">
      <div className="container-page py-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-700">
              {t("bangles.kicker")}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight sm:text-4xl">
              {t("bangles.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/70 sm:text-base">
              {t("bangles.note")}
            </p>
          </div>
          <Link
            href={`${ROUTES.collections}/gold-jewellery`}
            className={buttonClasses("secondary", "md")}
          >
            {t("bangles.cta")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:h-[33rem] sm:grid-cols-4 sm:grid-rows-2">
          {TILES.map((tile, index) => {
            const lead = index === 0;
            const wide = index === 1;
            const cell = lead
              ? "col-span-2 aspect-[16/10] sm:col-span-2 sm:row-span-2 sm:aspect-auto"
              : wide
                ? "col-span-2 aspect-[16/9] sm:col-span-2 sm:aspect-auto"
                : "aspect-[4/5] sm:aspect-auto";
            return (
              <li key={tile.key} className={`min-h-0 ${cell}`}>
                <figure className="group relative flex h-full min-h-0 flex-col overflow-hidden border border-gold/30 bg-offwhite">
                  <div className="relative min-h-0 flex-1 overflow-hidden">
                    <Photo
                      image={imageFor(tile.key)}
                      alt={pick(imageAlt(tile.key, tile.name), lang)}
                      sizes={tile.sizes}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                  </div>
                  {lead ? (
                    // Overlaid only on the lead tile: on a narrow cell the same
                    // block would cover most of the picture.
                    <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#160f08]/92 via-[#160f08]/55 to-transparent p-4 pt-16 text-cream sm:p-5 sm:pt-20">
                      <span className="block font-[family-name:var(--font-display)] text-xl sm:text-2xl">
                        {pick(tile.name, lang)}
                      </span>
                      <span className="mt-1 block max-w-md text-xs leading-relaxed text-cream/75 sm:text-sm">
                        {pick(tile.note, lang)}
                      </span>
                    </figcaption>
                  ) : (
                    <figcaption className="border-t border-gold/20 p-2.5 sm:p-3">
                      <span className="block font-[family-name:var(--font-display)] text-sm leading-snug sm:text-base">
                        {pick(tile.name, lang)}
                      </span>
                      {/* The note only on the wide cells: in a 200 px tile it
                          wrapped to five lines and pushed the name out of view. */}
                      {wide ? (
                        <span className="mt-0.5 hidden text-xs leading-snug text-charcoal/65 sm:block">
                          {pick(tile.note, lang)}
                        </span>
                      ) : null}
                    </figcaption>
                  )}
                </figure>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {askHref ? (
            <a
              href={askHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "md")}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("bangles.ask")}
            </a>
          ) : null}
          <p className="max-w-md text-xs leading-relaxed text-charcoal/60">{t("bangles.footnote")}</p>
        </div>
      </div>
    </section>
  );
}
