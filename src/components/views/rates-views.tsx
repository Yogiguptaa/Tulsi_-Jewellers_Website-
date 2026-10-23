"use client";

import Link from "next/link";
import { ArrowRight, Calculator, History, TrendingUp } from "lucide-react";
import { CONTACT, RATE_DISCLAIMER, ROUTES, telDisplay, telHref, whatsappHref } from "@/lib/config";
import type { RatesSnapshot } from "@/lib/rates/types";
import type { HistoryRow } from "@/components/rates/RateHistoryChart";
import { useLanguage } from "@/components/providers/LanguageProvider";
import PageHero from "@/components/ui/PageHero";
import Notice from "@/components/ui/Notice";
import RateBoard from "@/components/rates/RateBoard";
import RateHistoryChart from "@/components/rates/RateHistoryChart";
import GoldCalculator from "@/components/rates/GoldCalculator";

/** /rates */
export function RatesView({
  snapshot,
  historyDays,
  historyAvailable,
}: {
  snapshot: RatesSnapshot;
  historyDays: number;
  historyAvailable: boolean;
}) {
  const { t, lang } = useLanguage();
  const whatsapp = whatsappHref(
    lang === "hi"
      ? "नमस्ते, मुझे हीरे के दाम की जानकारी चाहिए।"
      : "Hello, I would like a diamond price quote.",
  );
  const phone = CONTACT.primaryPhone;

  return (
    <>
      <PageHero
        kicker={t("rates.kicker")}
        title={t("rates.title")}
        subtitle={t("rates.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.rates") }]}
      >
        <Link
          href="/rates/history"
          className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
        >
          <History className="h-4 w-4" aria-hidden="true" />
          {t("rates.viewHistory")}
        </Link>
        <Link
          href="/rates/calculator"
          className="inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          {t("rates.openCalculator")}
        </Link>
      </PageHero>

      <section className="container-page space-y-8 py-12 sm:py-16">
        <RateBoard snapshot={snapshot} />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
              {t("rates.historyTitle")}
            </h2>
            <p className="text-sm text-charcoal/70">{t("rates.historySubtitle")}</p>
            {historyAvailable ? (
              <p className="text-xs text-charcoal/70">
                {t("rates.historyRange", { days: historyDays })}
              </p>
            ) : (
              <Notice tone="info">{t("rates.historyEmptyBody")}</Notice>
            )}
            <Link
              href="/rates/history"
              className="inline-flex items-center gap-2 text-sm font-medium text-maroon underline underline-offset-4"
            >
              {t("rates.viewHistory")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
              {t("rates.calculatorTitle")}
            </h2>
            <p className="text-sm text-charcoal/70">{t("rates.calculatorSubtitle")}</p>
            <Link
              href="/rates/calculator"
              className="inline-flex items-center gap-2 rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              <Calculator className="h-4 w-4" aria-hidden="true" />
              {t("rates.openCalculator")}
            </Link>
          </div>
        </div>

        {/* Diamonds are deliberately NOT automated: there is no public daily
            rate and the trade price lists are licensed. The card says so and
            sends the customer to the counter instead of inventing a price. */}
        <section className="border border-gold/25 bg-offwhite p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
            {lang === "hi" ? "हीरे" : "Diamonds"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-charcoal/75">
            {lang === "hi"
              ? "कीमत कैरेट, कट, रंग, क्लैरिटी और प्रमाणपत्र पर निर्भर करती है। कोटेशन के लिए शोरूम आएं या व्हाट्सएप पर पूछें।"
              : "Prices depend on carat, cut, colour, clarity and certification. Visit the store or enquire on WhatsApp for a quote."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
              >
                {t("common.whatsapp")}
              </a>
            ) : null}
            <a
              href={telHref(phone)}
              className="inline-flex items-center gap-2 rounded-sm border border-gold/50 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              {t("common.call")} {telDisplay(phone)}
            </a>
          </div>
        </section>

        <Notice tone="info" title={t("rates.disclaimerTitle")}>
          {RATE_DISCLAIMER}
        </Notice>
      </section>
    </>
  );
}

/** /rates/history */
export function RateHistoryView({
  rows,
  days,
  notice,
}: {
  rows: HistoryRow[];
  days: number;
  notice: string | null;
}) {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("rates.kicker")}
        title={t("rates.historyTitle")}
        subtitle={t("rates.historySubtitle")}
        crumbs={[
          { href: ROUTES.home, label: t("common.home") },
          { href: ROUTES.rates, label: t("nav.rates") },
          { label: t("rates.historyTitle") },
        ]}
      />

      <section className="container-page space-y-6 py-12 sm:py-16">
        <p className="text-xs text-charcoal/70">{t("rates.historyRange", { days })}</p>
        {notice ? <Notice tone="info">{notice}</Notice> : null}
        <RateHistoryChart rows={rows} />
        <Notice tone="info" title={t("rates.disclaimerTitle")}>
          {RATE_DISCLAIMER}
        </Notice>
        <Link
          href={ROUTES.rates}
          className="inline-flex items-center gap-2 text-sm font-medium text-maroon underline underline-offset-4"
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {t("nav.rates")}
        </Link>
      </section>
    </>
  );
}

/** /rates/calculator */
export function CalculatorView({
  snapshot,
  providerNote,
}: {
  snapshot: RatesSnapshot;
  /** Resolved on the server: the client bundle cannot read non-public env vars. */
  providerNote: string | null;
}) {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("calc.kicker")}
        title={t("calc.title")}
        subtitle={t("calc.subtitle")}
        crumbs={[
          { href: ROUTES.home, label: t("common.home") },
          { href: ROUTES.rates, label: t("nav.rates") },
          { label: t("calc.title") },
        ]}
      />

      <section className="container-page space-y-6 py-12 sm:py-16">
        <GoldCalculator snapshot={snapshot} />
        <Notice tone="info" title={t("rates.disclaimerTitle")}>
          {RATE_DISCLAIMER}
        </Notice>
        {providerNote ? <p className="text-xs text-charcoal/70">{providerNote}</p> : null}
      </section>
    </>
  );
}
