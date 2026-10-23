"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";

/**
 * Share row. Uses the Web Share API when the device has one, otherwise copies
 * the canonical link. Nothing is sent anywhere by this component itself — the
 * opened app handles the share, exactly as the privacy page describes.
 */
export default function ShareRow({ url, title }: { url: string; title: string }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(t("common.linkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t("common.copyLink"));
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user dismissed the sheet — fall through to copy */
      }
    }
    await copy();
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-[0.16em] text-charcoal/70">{t("share.title")}</span>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 rounded-sm border border-gold/40 px-3 py-1.5 text-xs text-charcoal hover:bg-champagne/60"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("share.native")}
      </button>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-600/40 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-600/10"
      >
        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("share.whatsapp")}
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-sm border border-gold/40 px-3 py-1.5 text-xs text-charcoal hover:bg-champagne/60"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? t("common.linkCopied") : t("common.copyLink")}
      </button>
    </div>
  );
}
