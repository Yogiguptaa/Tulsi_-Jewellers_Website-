"use client";

import { pick } from "@/lib/config";
import { SERVICES } from "@/lib/content/trust";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Services, framed as things to ask about rather than promises. A service is
 * only ever described at the counter, so nothing here advertises availability
 * the showroom has not confirmed.
 */
export default function ServiceList() {
  const { lang, t } = useLanguage();

  return (
    <div className="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <li
            key={service.id}
            className="border border-gold/25 bg-offwhite px-4 py-3 text-sm text-charcoal"
          >
            {pick(service.name, lang)}
          </li>
        ))}
      </ul>
      <p className="text-xs text-charcoal/70">{t("about.serviceUnconfirmed")}</p>
    </div>
  );
}
