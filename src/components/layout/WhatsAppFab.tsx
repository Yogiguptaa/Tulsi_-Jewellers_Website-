"use client";

import { MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";

/** Floating WhatsApp button — desktop only (mobile uses the bottom bar). */
export default function WhatsAppFab() {
  const { t } = useLanguage();
  const href = whatsappHref("Hello Tulsi Jewellers, I would like to know more.");
  if (!href) return null;

  return (
    // Wrapped in a landmark so the floating button is not loose content outside
    // every landmark (axe "region").
    <aside aria-label={t("whatsapp.fab")} className="hidden lg:block">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp.fab")}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald text-offwhite shadow-lift transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </a>
    </aside>
  );
}
