"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { DELIVERY, ROUTES, pick, whatsappHref } from "@/lib/config";
import { GUIDES } from "@/lib/content/guides";
import { imageAlt, imageFor } from "@/lib/catalogue/images";
import type { DesignStyle } from "@/lib/designs";
import Photo from "@/components/catalogue/Photo";
import PageHero from "@/components/ui/PageHero";
import { buttonClasses } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * designs-views.tsx — the Popular Designs pages.
 *
 * These are STYLE pages, not product pages: no price, no weight, no stock claim,
 * and no photograph of another shop's piece dressed up as inventory. Every
 * photo is a manifest asset whose licence and author are printed on
 * /image-credits, and a style with no photograph says so in words.
 */

function DesignCard({ design }: { design: DesignStyle }) {
  const { lang } = useLanguage();
  const key = design.images[0];

  return (
    <li>
      <Link
        href={`${ROUTES.designs}/${design.slug}`}
        className="group flex h-full flex-col overflow-hidden border border-gold/25 bg-ivory transition-colors hover:border-maroon/40"
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-champagne/25">
          {key ? (
            <Photo
              image={imageFor(key)}
              alt={pick(imageAlt(key, design.name), lang)}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-4 text-center text-xs text-charcoal/60">
              {lang === "hi"
                ? "इस शैली की तस्वीर अभी नहीं है — व्हाट्सऐप पर नवीनतम देखें।"
                : "No photo of this style yet — ask on WhatsApp for the latest."}
            </span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-1.5 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
            {pick(design.kicker, lang)}
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg text-maroon">
            {pick(design.name, lang)}
          </span>
          <span className="text-sm leading-relaxed text-charcoal/70">
            {pick(design.summary, lang)}
          </span>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-medium text-maroon">
            {lang === "hi" ? "शैली देखें" : "See the style"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </li>
  );
}

export function DesignsIndexView({ designs }: { designs: DesignStyle[] }) {
  const { lang } = useLanguage();

  return (
    <>
      <PageHero
        kicker={lang === "hi" ? "लोकप्रिय डिज़ाइन" : "Popular designs"}
        title={
          lang === "hi"
            ? "भारतीय गहनों की लोकप्रिय शैलियाँ"
            : "Popular Indian jewellery styles"
        }
        subtitle={
          lang === "hi"
            ? "हर शैली के बारे में सीधी जानकारी: वह क्या है, कब पहनी जाती है, किस धातु में बनती है और उसकी देखभाल कैसे करें। यह स्टॉक की सूची नहीं है — काउंटर पर क्या है, वह बदलता रहता है, इसलिए नवीनतम देखने के लिए हमें संदेश करें।"
            : "Plain information about each style: what it is, when it is worn, which metal it is usually made in and how to look after it. This is not a stock list — what is on the counter changes often, so message us to see the latest."
        }
        crumbs={[
          { href: ROUTES.home, label: lang === "hi" ? "होम" : "Home" },
          { label: lang === "hi" ? "लोकप्रिय डिज़ाइन" : "Popular designs" },
        ]}
      />

      <section className="container-page py-12 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => (
            <DesignCard key={design.slug} design={design} />
          ))}
        </ul>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-charcoal/70">
          {lang === "hi"
            ? "तस्वीरें शैली दिखाने के लिए हैं, बिक्री के स्टॉक की नहीं। हर तस्वीर का फोटोग्राफर, स्रोत और लाइसेंस "
            : "Photographs illustrate the style, not the stock for sale. Every photograph's author, source and licence is listed on "}
          <Link href="/image-credits" className="text-maroon underline underline-offset-4">
            {lang === "hi" ? "इमेज क्रेडिट पेज" : "the image-credits page"}
          </Link>
          {lang === "hi" ? " पर दर्ज है।" : "."}
        </p>
      </section>
    </>
  );
}

export function DesignDetailView({
  design,
  related,
}: {
  design: DesignStyle;
  related: DesignStyle[];
}) {
  const { lang } = useLanguage();
  const wa = whatsappHref(
    `Hello Tulsi Jewellers, I would like to know more about ${design.enquiry}.`,
  );
  const guide = GUIDES.find((entry) => entry.slug === design.guideSlug);

  return (
    <>
      <PageHero
        kicker={pick(design.kicker, lang)}
        title={pick(design.name, lang)}
        subtitle={pick(design.summary, lang)}
        crumbs={[
          { href: ROUTES.home, label: lang === "hi" ? "होम" : "Home" },
          { href: ROUTES.designs, label: lang === "hi" ? "लोकप्रिय डिज़ाइन" : "Popular designs" },
          { label: pick(design.name, lang) },
        ]}
      >
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("primary", "md")}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {lang === "hi" ? "व्हाट्सऐप पर पूछें" : "Enquire on WhatsApp"}
          </a>
        ) : null}
        <Link href={ROUTES.rates} className={buttonClasses("secondary", "md")}>
          {lang === "hi" ? "आज का भाव देखें" : "See today's rate"}
        </Link>
      </PageHero>

      <section className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {design.images.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3">
              {design.images.map((key) => (
                <li key={key} className="overflow-hidden border border-gold/25 bg-champagne/20">
                  <span className="relative block aspect-[4/5]">
                    <Photo
                      image={imageFor(key)}
                      alt={pick(imageAlt(key, design.name), lang)}
                      sizes="(min-width: 1024px) 28vw, 45vw"
                      className="h-full w-full object-cover"
                    />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-gold/25 bg-ivory p-6">
              <p className="text-sm leading-relaxed text-charcoal/80">
                {lang === "hi"
                  ? "इस शैली की तस्वीर अभी शोरूम ने नहीं दी है। हमने किसी और दुकान की तस्वीर लगाना सही नहीं समझा। व्हाट्सऐप पर संदेश करें और हम काउंटर पर उपलब्ध नवीनतम टुकड़ों की तस्वीर भेज देंगे।"
                  : "We have not photographed this style at the counter yet, and we would rather show nothing than borrow another shop's picture. Message us on WhatsApp and we will send photographs of the pieces available now."}
              </p>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonClasses("primary", "md")} mt-4`}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {lang === "hi" ? "व्हाट्सऐप पर पूछें" : "Enquire on WhatsApp"}
                </a>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
              {lang === "hi" ? "इस शैली के बारे में" : "About this style"}
            </h2>
            <p className="text-sm leading-relaxed text-charcoal/80">
              {pick(design.description, lang)}
            </p>
          </div>

          <div className="border border-gold/25 bg-offwhite p-5">
            <h3 className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg">
              <Sparkles className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {lang === "hi" ? "किस अवसर के लिए" : "Usual occasions"}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-charcoal/80">
              {design.occasions.map((occasion) => (
                <li key={occasion.en}>{pick(occasion, lang)}</li>
              ))}
            </ul>
          </div>

          <div className="border border-gold/25 bg-offwhite p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg">
              {lang === "hi" ? "धातु और शुद्धता" : "Metal and purity"}
            </h3>
            <p className="mt-2 text-sm text-charcoal/80">{pick(design.metals, lang)}</p>
          </div>

          <div className="border border-gold/25 bg-offwhite p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg">
              {lang === "hi" ? "देखभाल" : "Care"}
            </h3>
            <p className="mt-2 text-sm text-charcoal/80">{pick(design.care, lang)}</p>
          </div>

          {guide ? (
            <p className="text-sm">
              <Link
                href={`/guides/${guide.slug}`}
                className="inline-flex items-center gap-1.5 font-medium text-maroon underline underline-offset-4"
              >
                {pick(guide.title, lang)}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-charcoal/70">{DELIVERY.outsideNagpurNote}</p>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="border-t border-gold/20 bg-offwhite/60">
          <div className="container-page py-12">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
              {lang === "hi" ? "और शैलियाँ" : "More styles"}
            </h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <DesignCard key={entry.slug} design={entry} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
