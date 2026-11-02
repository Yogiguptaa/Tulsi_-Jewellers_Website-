"use client";

/**
 * components/festivals/FestivalStrip.tsx
 *
 * One slim band under the header while a festival is near: the date, a countdown,
 * one factual line, and links to what the showroom sells. It renders nothing at
 * all when the server had no festival to show — no empty bar, no placeholder.
 *
 * It receives already-decided data, so the countdown can never disagree between
 * server and browser (the classic hydration mismatch), and switching language
 * only swaps the copy.
 */

import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { CONTACT, whatsappHref } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { FestivalStripData } from "@/lib/festivals/service";
import { textFor } from "@/lib/festivals/select";

export default function FestivalStrip({ data }: { data: FestivalStripData | null }) {
  const { lang, t } = useLanguage();
  if (!data) return null;

  const name = textFor(data.name, lang);
  const waHref = whatsappHref(
    lang === "hi"
      ? `नमस्ते तुलसी ज्वेलर्स, मुझे ${name} के बारे में जानकारी चाहिए।`
      : `Hello Tulsi Jewellers, I would like to know more for ${name}.`,
  );

  const countdown =
    data.phase === "today"
      ? `${t("festival.today")} · ${data.dateLabel[lang]}`
      : data.phase === "justPassed"
        ? t("festival.greeting", { name })
        : data.daysUntil === 1
          ? `${data.dateLabel[lang]} · ${t("festival.tomorrow")}`
          : `${data.dateLabel[lang]} · ${t("festival.inDays", { days: data.daysUntil })}`;

  return (
    <section
      aria-label={name}
      className="border-b border-gold/30 bg-gradient-to-r from-champagne/50 via-ivory to-champagne/30"
    >
      <div className="container-page flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-700">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-maroon">{name}</span>
            <span aria-hidden="true" className="text-gold">
              ·
            </span>
            <span className="normal-case tracking-normal text-charcoal/70">{countdown}</span>
          </p>
          <p className="mt-1 text-sm text-charcoal/85">
            {textFor(data.headline, lang)}{" "}
            <span className="text-charcoal/65">{textFor(data.subline, lang)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {data.categories.slice(0, 3).map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="inline-flex items-center gap-1 font-medium text-maroon underline underline-offset-4 hover:text-gold-700"
            >
              {textFor(category.label, lang)}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          ))}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-gold/50 bg-offwhite/70 px-3 py-1.5 font-medium text-maroon hover:bg-champagne/50"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t("festival.cta")}
            </a>
          ) : (
            <a
              href={`tel:${CONTACT.phones[0].number}`}
              className="inline-flex items-center gap-1.5 border border-gold/50 bg-offwhite/70 px-3 py-1.5 font-medium text-maroon"
            >
              {t("common.call")}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
