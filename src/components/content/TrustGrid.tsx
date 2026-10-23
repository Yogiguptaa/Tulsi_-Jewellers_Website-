"use client";

import { BadgeCheck, Factory, Globe2, Scale, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { pick } from "@/lib/config";
import { TRUST_POINTS } from "@/lib/content/trust";
import { useLanguage } from "@/components/providers/LanguageProvider";

const ICONS = [Store, Globe2, Scale, TrendingUp, BadgeCheck, Factory, ShieldCheck, ShieldCheck];

/**
 * "Why visit us" grid. Every card states something the owner has confirmed or
 * that is structurally true; cards awaiting confirmation render a visible
 * pending badge instead of a claim.
 */
export default function TrustGrid() {
  const { lang, t } = useLanguage();

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {TRUST_POINTS.map((point, index) => {
        const Icon = ICONS[index % ICONS.length];
        return (
          <article
            key={point.id}
            className="flex h-full flex-col gap-3 border border-gold/25 bg-offwhite p-5 shadow-[0_2px_18px_-16px_rgb(31_27_22_/_0.6)]"
          >
            <Icon className="h-5 w-5 text-gold-600" aria-hidden="true" />
            <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug">
              {pick(point.title, lang)}
            </h3>
            <p className="text-sm leading-relaxed text-charcoal/72">
              {pick(point.body, lang)}
            </p>
            {point.needsConfirmation ? (
              <p className="mt-auto inline-flex w-fit items-center gap-1.5 border border-dashed border-gold/60 bg-champagne/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/70">
                {t("about.ownerInput")}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
