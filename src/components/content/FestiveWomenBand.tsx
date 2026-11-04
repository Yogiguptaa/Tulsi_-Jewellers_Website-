"use client";

import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";
import { CONTACT, pick, telHref, whatsappHref } from "@/lib/config";
import { FESTIVE_CAMPAIGN } from "@/lib/content/festive-campaign";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Festive band for women's gold/silver/diamond styling.
 *
 * No discount, percentage or deadline is printed: those are commercial terms
 * only the owner can supply. The panel drives an enquiry, which is what a
 * showroom site can honestly do.
 */
export default function FestiveWomenBand() {
  const { lang } = useLanguage();
  if (!FESTIVE_CAMPAIGN.enabled) return null;

  const wa = whatsappHref(
    "Hello Tulsi Jewellers, I would like to know about the festive gold, silver and diamond designs for women.",
  );
  const phone = CONTACT.primaryPhone;

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="overflow-hidden rounded-sm border border-gold/40 bg-gradient-to-r from-maroon via-maroon-700 to-maroon px-6 py-8 text-offwhite shadow-lift sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-champagne">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {pick(FESTIVE_CAMPAIGN.kicker, lang)}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl">
              {pick(FESTIVE_CAMPAIGN.title, lang)}
            </h2>
            <p className="text-sm text-cream/85">{pick(FESTIVE_CAMPAIGN.body, lang)}</p>
            <p className="text-xs text-champagne/80">{pick(FESTIVE_CAMPAIGN.note, lang)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={wa ?? telHref(phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-champagne px-4 py-2.5 text-sm font-semibold text-maroon transition-colors hover:bg-cream"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={telHref(phone)}
              className="inline-flex items-center gap-2 rounded-sm border border-champagne/60 px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
            >
              Call
            </a>
          </div>
        </div>
        <p className="mt-5 text-[11px] text-cream/60">
          <Link href="/collections" className="underline underline-offset-4 hover:text-cream">
            {lang === "hi" ? "संग्रह देखें" : "Browse the collections"}
          </Link>
        </p>
      </div>
    </section>
  );
}
