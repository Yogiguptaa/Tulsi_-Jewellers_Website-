"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import {
  CONTACT,
  DELIVERY,
  FOOTER_POLICY_LINKS,
  ROUTES,
  SCHEME,
  SITE,
  isPlaceholder,
  pick,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import { ABOUT_SECTIONS } from "@/lib/content/about";
import { FAQ_GROUP_LABELS, FAQ_ITEMS, type FaqItem } from "@/lib/content/faq";
import { GUIDES, type Guide } from "@/lib/content/guides";
import type { Policy } from "@/lib/content/policies";
import { MEDIA_ASSETS } from "@/lib/catalogue/images";
import { useLanguage } from "@/components/providers/LanguageProvider";
import PageHero from "@/components/ui/PageHero";
import Notice from "@/components/ui/Notice";
import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import EnquiryForm from "@/components/forms/EnquiryForm";
import ServiceList from "@/components/content/ServiceList";
import ShowroomMap from "@/components/visit/ShowroomMap";
import OpenNow from "@/components/visit/OpenNow";
import SchemeCalculator from "@/components/scheme/SchemeCalculator";

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

function PhoneList() {
  const wa = whatsappHref();
  return (
    <ul className="space-y-2">
      <li>
        <a
          href={telHref(CONTACT.primaryPhone)}
          className="inline-flex items-center gap-2 text-sm text-charcoal hover:text-maroon"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          Call {telDisplay(CONTACT.primaryPhone)}
        </a>
      </li>
      {wa ? (
        <li>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-charcoal hover:text-maroon"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            WhatsApp {telDisplay(CONTACT.whatsappPhone)}
          </a>
        </li>
      ) : null}
    </ul>
  );
}

function HoursLine() {
  const { lang } = useLanguage();
  const hours = pick(CONTACT.hours, lang);
  return isPlaceholder(hours) ? (
    <span className="text-charcoal/70">
      {lang === "hi" ? "शोरूम से पुष्ट करें" : "Confirm with the showroom"}
    </span>
  ) : (
    <span>{hours}</span>
  );
}

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export function AboutView() {
  const { lang, t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("about.kicker")}
        title={t("about.title")}
        subtitle={t("about.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.about") }]}
      />

      <section className="container-page space-y-10 py-12 sm:py-16">
        {ABOUT_SECTIONS.map((section) => (
          <article key={section.id} className="grid gap-4 lg:grid-cols-[16rem_1fr]">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
                {pick(section.kicker, lang)}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
                {pick(section.heading, lang)}
              </h2>
              {section.needsOwnerInput ? (
                <span className="inline-block border border-dashed border-gold/60 bg-champagne/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/70">
                  {t("about.ownerInput")}
                </span>
              ) : null}
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-charcoal/80">
              {section.body.map((paragraph, index) => (
                <p key={index}>{pick(paragraph, lang)}</p>
              ))}
            </div>
          </article>
        ))}

        <div className="space-y-4">
          <SectionHeading
            align="left"
            title={t("about.servicesTitle")}
            subtitle={t("about.servicesSubtitle")}
          />
          <ServiceList />
        </div>

        <div className="space-y-4">
          <SectionHeading align="left" title={t("visit.phoneTitle")} />
          <PhoneList />
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.contact}
              className="rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              {t("nav.contact")}
            </Link>
            <Link
              href={ROUTES.visit}
              className="rounded-sm border border-gold/50 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              {t("nav.visit")}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 border border-gold/25 bg-offwhite p-6 sm:grid-cols-2 sm:p-8">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-700">
              {t("visit.addressTitle")}
            </p>
            <p className="text-sm text-charcoal/85">{pick(CONTACT.address, lang)}</p>
            <p className="text-sm text-charcoal/85">{pick(CONTACT.hours, lang)}</p>
            <a
              href={CONTACT.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-maroon hover:underline"
            >
              {t("common.directions")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-700">
              {t("about.establishedTitle")}
            </p>
            <p className="text-sm text-charcoal/85">
              {t("about.establishedBody", { year: CONTACT.establishedYear })}
            </p>
            <p className="text-sm text-charcoal/85">{t("about.collectionsLine")}</p>
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Visit                                                                      */
/* -------------------------------------------------------------------------- */

export function VisitView() {
  const { lang, t } = useLanguage();
  const wa = whatsappHref("Hello Tulsi Jewellers, I would like to visit the showroom.");

  return (
    <>
      <PageHero
        kicker={t("visit.kicker")}
        title={t("visit.title")}
        subtitle={t("visit.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.visit") }]}
      />

      <section className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
            {t("visit.mapTitle")}
          </h2>
          <ShowroomMap />
        </div>

        <aside className="space-y-6">
          <div className="space-y-2 border border-gold/25 bg-offwhite p-5">
            <h3 className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg">
              <MapPin className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t("visit.addressTitle")}
            </h3>
            <p className="text-sm text-charcoal/80">
              {isPlaceholder(pick(CONTACT.address, lang))
                ? pick(CONTACT.area, lang)
                : pick(CONTACT.address, lang)}
            </p>
          </div>

          <div className="space-y-2 border border-gold/25 bg-offwhite p-5">
            <h3 className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg">
              <Clock className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t("visit.hoursTitle")}
            </h3>
            <p className="text-sm">
              <HoursLine />
            </p>
            {/* Open/closed is computed from the published hours in Asia/Kolkata
                and hides itself while those hours are still a placeholder. */}
            <OpenNow className="pt-1" />
          </div>

          <div className="space-y-2 border border-gold/25 bg-offwhite p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg">{t("visit.phoneTitle")}</h3>
            <PhoneList />
          </div>

          <div className="space-y-3 border border-gold/25 bg-offwhite p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg">
              {t("visit.beforeYouCome")}
            </h3>
            <p className="text-sm text-charcoal/75">
              {lang === "hi"
                ? "जो वस्तुएँ देखना चाहते हैं, पहले कॉल या संदेश करें — हम उन्हें तैयार रखेंगे।"
                : "Call or message first and we will keep the items you want to see ready for you."}
            </p>
            <div className="flex flex-col gap-2">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t("common.whatsapp")}
                </a>
              ) : null}
              <a
                href={telHref(CONTACT.phones[0].number)}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-gold/50 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {telDisplay(CONTACT.phones[0].number)}
              </a>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export function ContactView() {
  const { t } = useLanguage();
  const wa = whatsappHref("Hello Tulsi Jewellers, I have an enquiry.");

  return (
    <>
      <PageHero
        kicker={t("contact.kicker")}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.contact") }]}
      />

      <section className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-6">
          <div className="space-y-3 border border-gold/25 bg-offwhite p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg">
              {t("contact.phonesTitle")}
            </h2>
            <PhoneList />
            <p className="text-xs text-charcoal/70">{t("contact.primaryPending")}</p>
          </div>

          <div className="space-y-3 border border-gold/25 bg-offwhite p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg">{t("visit.addressTitle")}</h2>
            <p className="text-sm text-charcoal/80">
              {isPlaceholder(pick(CONTACT.address, "en"))
                ? pick(CONTACT.area, "en")
                : pick(CONTACT.address, "en")}
            </p>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("common.whatsapp")}
              </a>
            ) : null}
          </div>

          <div className="border border-dashed border-gold/50 bg-champagne/20 p-5 text-xs leading-relaxed text-charcoal/70">
            {DELIVERY.outsideNagpurNote}
          </div>
        </aside>

        <EnquiryForm
          kind="general"
          title={t("contact.formTitle")}
          subtitle={t("enquiry.subtitle")}
        />
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export function FaqView({ items = FAQ_ITEMS }: { items?: FaqItem[] }) {
  const { lang, t } = useLanguage();
  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <>
      <PageHero
        kicker={t("faq.kicker")}
        title={t("faq.title")}
        subtitle={t("faq.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.faq") }]}
      />

      <section className="container-page space-y-10 py-12 sm:py-16">
        {groups.map((group) => (
          <div key={group} className="space-y-4">
            <SectionHeading
              align="left"
              ornament={false}
              title={
                <span className="text-xl sm:text-2xl">{pick(FAQ_GROUP_LABELS[group], lang)}</span>
              }
            />
            <Accordion
              items={items.filter((item) => item.group === group).map((item) => ({
                id: item.id,
                question: pick(item.question, lang),
                answer: pick(item.answer, lang),
              }))}
            />
          </div>
        ))}

        <div className="space-y-4 border border-gold/25 bg-offwhite p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            {t("faq.stillQuestions")}
          </h2>
          <p className="text-sm text-charcoal/75">{t("faq.stillQuestionsBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.contact}
              className="rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              {t("nav.contact")}
            </Link>
            <a
              href={telHref(CONTACT.phones[0].number)}
              className="rounded-sm border border-gold/50 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              {telDisplay(CONTACT.phones[0].number)}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Gold saving scheme                                                         */
/* -------------------------------------------------------------------------- */

const SCHEME_STEPS = [
  {
    en: "Choose a monthly amount, starting from ₹499.",
    hi: "₹499 से शुरू होने वाली मासिक राशि चुनें।",
  },
  {
    en: "Save that amount every month at the showroom.",
    hi: "हर महीने शोरूम पर वह राशि जमा करें।",
  },
  {
    en: "Pick the jewellery you want when your savings are ready.",
    hi: "बचत पूरी होने पर अपनी पसंद के गहने चुनें।",
  },
];

export function SchemeView() {
  const { lang, t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("scheme.kicker")}
        title={t("scheme.title")}
        subtitle={t("scheme.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.scheme") }]}
      />

      <section className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <div className="space-y-4">
            <SectionHeading align="left" title={t("scheme.howItWorks")} />
            <ol className="space-y-3">
              {SCHEME_STEPS.map((step, index) => (
                <li key={step.en} className="flex gap-3 border border-gold/25 bg-offwhite p-4">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon text-xs font-semibold text-offwhite">
                    {index + 1}
                  </span>
                  <p className="text-sm text-charcoal/85">{pick(step, lang)}</p>
                </li>
              ))}
            </ol>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {SCHEME.highlights.map((highlight) => (
              <li
                key={highlight.en}
                className="flex items-start gap-2 border border-gold/25 bg-champagne/20 px-4 py-3 text-sm text-charcoal/85"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                {pick(highlight, lang)}
              </li>
            ))}
          </ul>

          {/* Instalment arithmetic only — no bonus or benefit figure is shown,
              because the showroom's scheme card is what states those terms. */}
          <SchemeCalculator />

          <div className="space-y-3">
            <SectionHeading align="left" title={t("scheme.termsTitle")} />
            <p className="text-sm leading-relaxed text-charcoal/85">
              {lang === "hi" ? SCHEME.termsHi : SCHEME.terms}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.rates}
              className="inline-flex items-center gap-2 rounded-sm border border-gold/50 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              {t("nav.rates")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              href={ROUTES.visit}
              className="inline-flex items-center gap-2 rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              {t("nav.visit")}
            </Link>
          </div>
        </div>

        <aside>
          <EnquiryForm
            kind="scheme"
            withMonthlyAmount
            title={t("scheme.enrolTitle")}
            subtitle={t("scheme.enrolBody")}
          />
        </aside>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Guides                                                                     */
/* -------------------------------------------------------------------------- */

export function GuidesView() {
  const { lang, t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("guides.kicker")}
        title={t("guides.title")}
        subtitle={t("guides.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("guides.title") }]}
      />

      <section className="container-page py-12 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="flex h-full flex-col gap-3 border border-gold/25 bg-offwhite p-5 transition-colors hover:border-maroon/40"
              >
                <BookOpen className="h-5 w-5 text-gold-600" aria-hidden="true" />
                <span className="text-[11px] uppercase tracking-[0.16em] text-charcoal/70">
                  {pick(guide.topic, lang)}
                </span>
                <span className="font-[family-name:var(--font-display)] text-xl">
                  {pick(guide.title, lang)}
                </span>
                <span className="text-sm text-charcoal/70">{pick(guide.summary, lang)}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-maroon">
                  {t("guides.readGuide")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function GuideDetailView({ guide }: { guide: Guide }) {
  const { lang, t } = useLanguage();
  const words = guide.sections.reduce(
    (total, section) => total + section.body.en.split(/\s+/).length + section.body.hi.split(/\s+/).length,
    0,
  );
  const minutes = Math.max(1, Math.round(words / 400));

  return (
    <>
      <PageHero
        kicker={pick(guide.topic, lang)}
        title={pick(guide.title, lang)}
        subtitle={pick(guide.summary, lang)}
        crumbs={[
          { href: ROUTES.home, label: t("common.home") },
          { href: "/guides", label: t("guides.title") },
          { label: pick(guide.title, lang) },
        ]}
      />

      <article className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          <p className="text-xs text-charcoal/70">{t("guides.minutes", { count: minutes })}</p>
          {guide.sections.map((section) => (
            <section key={section.heading.en} className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
                {pick(section.heading, lang)}
              </h2>
              <p className="text-sm leading-relaxed text-charcoal/85 sm:text-base">
                {pick(section.body, lang)}
              </p>
            </section>
          ))}

          <Notice tone="info">
            {lang === "hi"
              ? "यह सामान्य जानकारी है, हमारी दुकान की नीति नहीं। असली नीतियाँ शोरूम की लिखित शर्तों से तय होती हैं।"
              : "This is general information, not our shop's policy. The showroom's written terms govern an actual purchase."}
          </Notice>

          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm font-medium text-maroon underline underline-offset-4"
          >
            {t("guides.backToGuides")}
          </Link>
        </div>

        <aside className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{t("guides.otherGuides")}</h2>
          <ul className="divide-y divide-gold/25 border-y border-gold/25">
            {GUIDES.filter((entry) => entry.slug !== guide.slug).map((entry) => (
              <li key={entry.slug}>
                <Link href={`/guides/${entry.slug}`} className="block py-2.5 text-sm hover:text-maroon">
                  {pick(entry.title, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </article>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Policies                                                                   */
/* -------------------------------------------------------------------------- */

export function PolicyView({ policy }: { policy: Policy }) {
  const { lang, t } = useLanguage();
  const others = FOOTER_POLICY_LINKS.filter((link) => link.href !== policy.route);

  return (
    <>
      <PageHero
        kicker={t("policy.kicker")}
        title={pick(policy.title, lang)}
        subtitle={pick(policy.summary, lang)}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: pick(policy.title, lang) }]}
      />

      <article className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading.en} className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
                {pick(section.heading, lang)}
              </h2>
              {section.body.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-charcoal/85 sm:text-base">
                  {pick(paragraph, lang)}
                </p>
              ))}
            </section>
          ))}

          {/* The contact facts every policy page needs, in place of the old
              "information we do not publish online yet" checklist. */}
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
              {t("policy.contactTitle")}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700">
                  {t("visit.addressTitle")}
                </dt>
                <dd className="text-sm text-charcoal/85">{pick(CONTACT.address, lang)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700">
                  {t("visit.hoursTitle")}
                </dt>
                <dd className="text-sm text-charcoal/85">{pick(CONTACT.hours, lang)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700">
                  {t("visit.phoneTitle")}
                </dt>
                <dd className="text-sm text-charcoal/85">
                  <ul className="space-y-1">
                    {CONTACT.phones.filter((entry) => entry.label !== "WhatsApp").map((entry) => (
                      <li key={entry.number}>
                        <a href={telHref(entry.number)} className="text-maroon hover:underline">
                          {telDisplay(entry.number)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700">
                  {t("policy.bindingTitle")}
                </dt>
                <dd className="text-sm text-charcoal/85">{t("policy.bindingBody")}</dd>
              </div>
            </dl>
          </section>

          <p className="text-xs text-charcoal/70">
            {SITE.name.en} · {pick(CONTACT.area, lang)} · {telDisplay(CONTACT.phones[0].number)}
          </p>
        </div>

        <aside className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{t("policy.otherPolicies")}</h2>
          <ul className="divide-y divide-gold/25 border-y border-gold/25">
            {others.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-2.5 text-sm hover:text-maroon">
                  {pick(link.label, lang)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/guides" className="block py-2.5 text-sm hover:text-maroon">
                {t("guides.title")}
              </Link>
            </li>
          </ul>
        </aside>
      </article>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Image credits                                                              */
/* -------------------------------------------------------------------------- */

export function ImageCreditsView() {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("credits.kicker")}
        title={t("credits.title")}
        subtitle={t("credits.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("credits.title") }]}
      />

      <section className="container-page space-y-6 py-12 sm:py-16">
        <Notice tone="info">{t("credits.body")}</Notice>

        {MEDIA_ASSETS.length === 0 ? (
          <p className="text-sm text-charcoal/70">{t("credits.empty")}</p>
        ) : (
          <div className="overflow-x-auto border border-gold/25 bg-offwhite">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">{t("credits.title")}</caption>
              <thead>
                <tr className="border-b border-gold/25 bg-champagne/25 text-left text-[11px] uppercase tracking-[0.12em] text-charcoal/70">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("credits.work")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("credits.credit")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("credits.license")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("credits.sourcePage")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/20">
                {MEDIA_ASSETS.map((asset) => (
                  <tr key={asset.key}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block text-charcoal/85">
                        {asset.credit.title.replace(/^File:/, "")}
                      </span>
                      <span className="block font-mono text-[11px] text-charcoal/70">
                        {asset.src}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-charcoal/80">
                      {asset.credit.creator}
                      <span className="block text-[11px] text-charcoal/70">
                        {asset.credit.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-charcoal/80">
                      {asset.credit.licenseUrl ? (
                        <a
                          href={asset.credit.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4"
                        >
                          {asset.credit.license}
                        </a>
                      ) : (
                        asset.credit.license
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={asset.credit.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-maroon underline underline-offset-4"
                      >
                        {t("credits.source")}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
