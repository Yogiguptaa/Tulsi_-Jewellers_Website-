"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Gem,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  COLLECTIONS,
  CONTACT,
  DELIVERY,
  ROUTES,
  SCHEME,
  SITE,
  isPlaceholder,
  pick,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import { FAQ_ITEMS } from "@/lib/content/faq";
import type { Review } from "@/lib/content/reviews";
import { GUIDES } from "@/lib/content/guides";
import { getFeatured } from "@/lib/catalogue/select";
import { MEDIA_ASSETS } from "@/lib/catalogue/images";
import HeroMedia from "@/components/catalogue/HeroMedia";
import type { Product } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { buttonClasses } from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import ProductGrid from "@/components/catalogue/ProductGrid";
import RateTicker from "@/components/rates/RateTicker";
import type { ApiRatesPayload } from "@/lib/rates/api-payload";
import TrustGrid from "@/components/content/TrustGrid";
import TrendingStyles from "@/components/content/TrendingStyles";
import BangleShowcase from "@/components/content/BangleShowcase";
import ReviewCarousel from "@/components/content/ReviewCarousel";

/**
 * Home page. Ordered for a visitor who may only scroll once: what the showroom
 * is, today's rate, what it sells, why to trust it, how to reach it.
 *
 * Honesty rules visible on this page:
 *  • the rate strip shows nothing until a real benchmark is recorded
 *  • only real inventory appears; with none published the page says so
 *  • reviews appear only when real, approved ones exist, and the delivery limit is stated plainly
 */
export default function HomeView({
  products,
  source,
  reviews = null,
  initialRates = null,
}: {
  products: Product[];
  source: "database" | "empty";
  /** Owner-approved reviews from the database, or null when there are none. */
  reviews?: Review[] | null;
  /** Today's rate, rendered with the page instead of fetched after it. */
  initialRates?: ApiRatesPayload | null;
}) {
  const { lang, t } = useLanguage();
  const featured = getFeatured(products, 8);
  const waHref = whatsappHref("Hello Tulsi Jewellers, I would like to know more.");
  const phone = CONTACT.phones[0];
  const faqPreview = FAQ_ITEMS.filter((item) =>
    ["where", "what-sell", "delivery-outside", "rates", "scheme"].includes(item.id),
  );

  return (
    <>
      {/* Hero */}
      <section className="light-sweep bg-gradient-to-b from-offwhite via-ivory to-champagne/40">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            {/* The wordmark lives once, in the header — repeating it here made
                the hero feel like a second masthead. */}
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-700">
              {t("home.heroKicker")}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] text-maroon sm:text-4xl lg:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <span className="ornament text-gold" aria-hidden="true" />
            <p className="max-w-xl text-base italic text-charcoal/75 sm:text-lg">
              {pick(SITE.tagline, lang)}
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-charcoal/70 sm:text-base">
              {t("home.heroBody")}
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href={ROUTES.collections} className={buttonClasses("primary", "lg")}>
                {t("home.explore")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.rates} className={buttonClasses("secondary", "lg")}>
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                {t("home.viewRates")}
              </Link>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("dark", "lg")}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t("home.whatsapp")}
                </a>
              ) : (
                <a href={telHref(phone.number)} className={buttonClasses("dark", "lg")}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {telDisplay(phone.number)}
                </a>
              )}
              <Link href={ROUTES.visit} className={buttonClasses("secondary", "lg")}>
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {t("nav.visit")}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden border border-gold/30 shadow-lift">
              <HeroMedia
                video={
                  MEDIA_ASSETS.find(
                    (asset) => asset.kind === "video" && asset.category === "hero",
                  ) ?? null
                }
                fallbackKey="kadaMeenakari"
                alt={
                  lang === "hi"
                    ? "हरी-लाल मीनाकारी जड़ाऊ सोने का कड़ा"
                    : "Gold kada inlaid with green and red meenakari enamel"
                }
                sizes="(min-width: 1024px) 44vw, 92vw"
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 border border-gold/40 bg-offwhite/95 px-4 py-3 shadow-soft sm:left-6 sm:right-auto sm:w-72">
              <p className="font-[family-name:var(--font-display)] text-lg text-maroon">
                {SCHEME.name.en}
              </p>
              <p className="text-xs text-charcoal/70">
                {lang === "hi"
                  ? `₹${SCHEME.startingAmountINR} से शुरू · मासिक बचत`
                  : `Starts from ₹${SCHEME.startingAmountINR} · monthly savings`}
              </p>
              <Link
                href={ROUTES.scheme}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-gold-700 hover:text-maroon"
              >
                {t("home.schemeCta")}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live rate strip */}
      <RateTicker initial={initialRates} />

      {/* Trust */}
      <section className="container-page py-14 sm:py-16">
        <SectionHeading
          kicker={SITE.name.en}
          title={t("home.trustTitle")}
          subtitle={t("home.trustSubtitle")}
        />
        <div className="mt-8">
          <TrustGrid />
        </div>
      </section>

      {/* Collections */}
      <section className="border-y border-gold/20 bg-offwhite/70">
        <div className="container-page py-14 sm:py-16">
          <SectionHeading
            kicker={t("collections.kicker")}
            title={t("home.collectionsTitle")}
            subtitle={t("home.collectionsSubtitle")}
          />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((collection) => {
              const count = products.filter((product) => product.categorySlug === collection.slug).length;
              return (
                <li key={collection.slug}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="group flex h-full flex-col gap-2 border border-gold/25 bg-ivory p-5 transition-colors hover:border-maroon/40 hover:bg-champagne/25"
                  >
                    <Gem className="h-5 w-5 text-gold-600" aria-hidden="true" />
                    <h3 className="font-[family-name:var(--font-display)] text-xl">
                      {pick(collection.name, lang)}
                    </h3>
                    <p className="text-sm text-charcoal/70">{pick(collection.description, lang)}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-maroon">
                      {t("collections.explore")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {count > 0 ? (
                      <span className="text-[11px] text-charcoal/70">
                        {t("collections.count", { count })}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Featured — only real published pieces. With none, the entire section
          is omitted: an empty "New designs arriving" box read as an unfinished
          page, so the popular-designs strip takes its place instead. */}
      {featured.length > 0 && source !== "empty" ? (
        <section className="container-page py-14 sm:py-16">
          <SectionHeading
            kicker={t("home.featuredKicker")}
            title={t("home.featuredTitle")}
            subtitle={t("home.featuredSubtitle")}
          />
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
          <div className="mt-8 text-center">
            <Link href={ROUTES.collections} className={buttonClasses("secondary", "md")}>
              {t("common.showAll")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* Popular designs — style, not stock. */}
      <TrendingStyles />

      {/* The bangle room: a mosaic of four styles, each with its own enquiry. */}
      <BangleShowcase />

      {/* Scheme */}
      <section className="bg-maroon text-offwhite">
        <div className="container-page grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-100">
              {t("scheme.kicker")}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-offwhite sm:text-4xl">
              {pick(SCHEME.name, lang)}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-champagne/90 sm:text-base">
              {t("home.schemeBody")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={ROUTES.scheme} className={buttonClasses("onDark", "lg")}>
                <BadgeIndianRupee className="h-4 w-4" aria-hidden="true" />
                {t("home.schemeCta")}
              </Link>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("onDark", "lg")}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t("common.whatsapp")}
                </a>
              ) : null}
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {SCHEME.highlights.map((highlight) => (
              <li
                key={highlight.en}
                className="flex items-start gap-2 border border-champagne/25 bg-maroon-700/60 px-4 py-3 text-sm text-champagne"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-100" aria-hidden="true" />
                {pick(highlight, lang)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Visit + guides */}
      <section className="container-page grid gap-10 py-14 sm:py-16 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionHeading
            align="left"
            title={t("home.visitTitle")}
            subtitle={t("home.visitBody")}
          />
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-charcoal/70">{t("visit.addressTitle")}</dt>
              <dd className="text-charcoal/85">
                {/* One address, from config: the same street address the header,
                    footer, schema and metadata print. The locality is only a
                    fallback while the full address is a placeholder. */}
                {isPlaceholder(pick(CONTACT.address, lang))
                  ? pick(CONTACT.area, lang)
                  : pick(CONTACT.address, lang)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-charcoal/70">{t("visit.hoursTitle")}</dt>
              <dd className="text-charcoal/85">
                {pick(CONTACT.hours, lang).startsWith("[")
                  ? lang === "hi"
                    ? "शोरूम से पुष्ट करें"
                    : "Confirm with the showroom"
                  : pick(CONTACT.hours, lang)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-charcoal/70">{t("visit.phoneTitle")}</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">
                {CONTACT.phones.map((entry) => (
                  <a key={entry.number} href={telHref(entry.number)} className="text-maroon hover:underline">
                    {telDisplay(entry.number)}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-charcoal/70">{DELIVERY.outsideNagpurNote}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={ROUTES.visit} className={buttonClasses("primary", "md")}>
              {t("nav.visit")}
            </Link>
            <Link href={ROUTES.contact} className={buttonClasses("ghost", "md")}>
              {t("nav.contact")}
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading
            align="left"
            title={t("home.guidesTitle")}
            subtitle={t("home.guidesSubtitle")}
          />
          <ul className="divide-y divide-gold/25 border-y border-gold/25">
            {GUIDES.slice(0, 5).map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="flex items-start justify-between gap-4 py-3 hover:text-maroon"
                >
                  <span>
                    <span className="block font-[family-name:var(--font-display)] text-lg">
                      {pick(guide.title, lang)}
                    </span>
                    <span className="mt-0.5 block text-xs text-charcoal/70">
                      {pick(guide.summary, lang)}
                    </span>
                  </span>
                  <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon underline underline-offset-4"
          >
            {t("common.showAll")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Reviews (sample layout only) */}
      <section className="border-y border-gold/20 bg-offwhite/70">
        <div className="container-page py-14 sm:py-16">
          <SectionHeading
            kicker={t("faq.kicker")}
            title={t("home.faqTitle")}
            subtitle={t("home.faqSubtitle")}
            id="faq-preview"
          />
          <div className="mx-auto mt-8 max-w-3xl">
            <Accordion
              items={faqPreview.map((item) => ({
                id: item.id,
                question: pick(item.question, lang),
                answer: pick(item.answer, lang),
              }))}
              defaultOpenId={null}
            />
            <div className="mt-6 text-center">
              <Link href={ROUTES.faq} className={buttonClasses("secondary", "md")}>
                {t("faq.title")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Customer reviews. The whole block is hidden while the showroom has no
          genuine, approved reviews: there are no sample slots to fall back on. */}
      {reviews && reviews.length > 0 ? (
        <section className="container-page py-14 sm:py-16">
          <SectionHeading
            title={t("home.reviewsTitle")}
            subtitle={t("home.reviewsSubtitle")}
            align="center"
          />
          <div className="mx-auto mt-8 max-w-3xl">
            <ReviewCarousel reviews={reviews} />
          </div>
        </section>
      ) : null}
    </>
  );
}
