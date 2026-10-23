"use client";

import { Info, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SITE, pick, type LocalizedText } from "@/lib/config";
import { useStoredValue } from "@/lib/storage";

const STORAGE_KEY = "tulsi_announcement_dismissed";

/**
 * Top announcement bar.
 *
 * `message` comes from an active row in the `announcements` table (written in
 * /admin). When there is none — or Supabase is not configured — the bar falls
 * back to factual brand copy. Nothing here ever invents a promotion: whatever an
 * operator types is what a visitor reads, in both languages.
 */
export default function AnnouncementBar({ message }: { message?: LocalizedText }) {
  const { t, lang } = useLanguage();
  const [dismissed, setDismissed] = useStoredValue<boolean>(
    STORAGE_KEY,
    false,
    (raw) => raw === "true",
    (value) => String(value),
  );

  if (dismissed) return null;

  const text = message ? pick(message, lang) : `${pick(SITE.name, lang)} — ${pick(SITE.tagline, lang)}`;

  return (
    // `aside` (a complementary landmark) so this text belongs to a landmark:
    // axe's "region" rule flags loose content that sits outside every landmark.
    // Fixed deep maroon in both themes: the `maroon` token turns to lit gold at
    // night, which made the top strip read as a warning bar rather than a brand
    // ribbon. This one surface keeps its own colours.
    <aside aria-label={t("announcement.label")} className="bg-[#4c0c17] text-[#f2e6cd]">
      <div className="container-page flex items-center justify-center gap-3 py-2 text-center text-xs sm:text-sm">
        <Info className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden="true" />
        <span className="sr-only">{t("announcement.label")}:</span>
        <span className="leading-snug">{text}</span>
        {/* 24×24 rather than 22×22 — the smallest a thumb target may be — with
            the glyph unchanged, so the bar keeps its height. */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t("common.close")}
          className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition-opacity hover:opacity-70"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
