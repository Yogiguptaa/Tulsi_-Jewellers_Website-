"use client";

import { MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Shown when there is no real inventory to list. It never fills the gap with
 * filler products: it invites the customer to the showroom and offers the one
 * thing that is actually true — the showroom can answer on WhatsApp today.
 */
export default function EmptyCatalogue({ plain = false }: { plain?: boolean } = {}) {
  const { t } = useLanguage();
  const href = whatsappHref(
    "Hello Tulsi Jewellers, which designs are available in the showroom today?",
  );

  return (
    <div
      className={
        plain
          ? "text-center"
          : "border border-gold/30 bg-offwhite px-6 py-10 text-center"
      }
    >
      <p className="font-[family-name:var(--font-display)] text-xl text-maroon">
        {t("catalogue.emptyTitle")}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-charcoal/75">
        {t("catalogue.emptyBody")}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {t("catalogue.emptyCta")}
        </a>
      ) : null}
    </div>
  );
}
