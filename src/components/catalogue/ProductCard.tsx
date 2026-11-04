"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, X } from "lucide-react";
import { formatINR } from "@/lib/rates/format";
import { pick, whatsappHref } from "@/lib/config";
import { imageFor } from "@/lib/catalogue/images";
import {
  CATALOGUE_TYPE_BADGES,
  availabilityLabel,
  availabilityTone,
  enquiryMessage,
} from "@/lib/catalogue/catalogue-kind";
import Photo from "@/components/catalogue/Photo";
import type { Product } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWishlist } from "@/lib/wishlist";

const SOLD_OUT = { en: "Not available right now", hi: "अभी उपलब्ध नहीं" };

export default function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLanguage();
  const { has, toggle } = useWishlist();
  const [quickView, setQuickView] = useState(false);
  const saved = has(product.code);
  const tone = availabilityTone(product);
  const enquiry = whatsappHref(enquiryMessage(product));

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-gold/30 bg-offwhite shadow-[0_2px_18px_-14px_rgb(31_27_22_/_0.5)] transition-shadow hover:shadow-soft">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-ivory via-champagne/50 to-gold-100">
        <Link href={`/products/${product.slug}`} aria-label={pick(product.name, lang)} className="block h-full w-full">
          <Photo
            image={imageFor(product.imageKeys[0] ?? "")}
            alt={pick(product.name, lang)}
            sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        </Link>

        {/* Provenance sits on the photograph itself, so an inspiration or supplier
            design cannot be mistaken for showroom stock from the grid. A showroom
            piece is labelled only once it is recorded as in stock. */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.catalogueType !== "showroom" ? (
            <span className="rounded-sm border border-maroon/40 bg-offwhite/90 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-maroon">
              {pick(CATALOGUE_TYPE_BADGES[product.catalogueType], lang)}
            </span>
          ) : tone === "out" ? (
            <span className="rounded-sm border border-maroon/40 bg-offwhite/90 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-maroon">
              {pick(SOLD_OUT, lang)}
            </span>
          ) : tone === "stock" ? (
            <span className="rounded-sm border border-emerald-600/40 bg-offwhite/90 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-emerald-700">
              {availabilityLabel(product, lang)}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.code)}
          aria-pressed={saved}
          aria-label={saved ? t("catalogue.wishlistRemove") : t("catalogue.wishlistAdd")}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-offwhite/90 text-maroon hover:bg-champagne/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-maroon" : ""}`} aria-hidden="true" />
        </button>

        {/* Quick view: purity, weight, availability and price without leaving the
            grid. Nothing is added that the product page does not already state. */}
        <button
          type="button"
          onClick={() => setQuickView(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-3 rounded-sm border border-gold/50 bg-offwhite/95 px-3 py-1.5 text-[11px] font-medium text-charcoal opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {t("catalogue.quickView")}
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug text-charcoal">
          <Link href={`/products/${product.slug}`} className="hover:text-maroon">
            {pick(product.name, lang)}
          </Link>
        </h3>

        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-charcoal/70">
          {product.purity ? (
            <div>
              <dt className="sr-only">{t("catalogue.purity")}</dt>
              <dd>{product.purity === "925" ? "Silver 925" : `${product.purity} gold`}</dd>
            </div>
          ) : null}
          {product.weightGrams ? (
            <div>
              <dt className="sr-only">{t("catalogue.weight")}</dt>
              <dd>
                {product.weightGrams} g
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="sr-only">{t("catalogue.itemCode")}</dt>
            <dd className="font-mono text-[11px] text-charcoal/70">{product.code}</dd>
          </div>
        </dl>

        <div className="mt-auto space-y-1">
          <p className="font-medium text-maroon">
            {product.priceType === "fixed" && product.priceINR !== null
              ? `₹ ${formatINR(product.priceINR)}`
              : product.availability === "sold_out"
                ? pick({ en: "Not available", hi: "उपलब्ध नहीं" }, lang)
                : t("catalogue.priceOnEnquiry")}
          </p>
          {product.catalogueType !== "showroom" ? (
            <p className="text-[11px] leading-snug text-charcoal/70">
              {availabilityLabel(product, lang)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex flex-1 items-center justify-center rounded-sm bg-maroon px-3 py-2 text-xs font-medium text-offwhite hover:bg-maroon-700"
          >
            {t("catalogue.viewDetails")}
          </Link>
          {enquiry ? (
            <a
              href={enquiry}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t("catalogue.enquireWhatsapp")} — ${product.name.en}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-emerald-600/50 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-600/10"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t("catalogue.enquireShort")}
            </a>
          ) : null}
        </div>
      </div>

      {quickView ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-charcoal/50 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${t("catalogue.quickView")} — ${pick(product.name, lang)}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setQuickView(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuickView(false);
          }}
        >
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-offwhite p-5 sm:rounded-sm">
            <button
              type="button"
              onClick={() => setQuickView(false)}
              aria-label={t("catalogue.quickViewClose")}
              autoFocus
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-offwhite text-charcoal/70 hover:bg-champagne/70"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div className="aspect-[4/5] overflow-hidden border border-gold/25 bg-gradient-to-br from-ivory via-champagne/50 to-gold-100">
                <Photo
                  image={imageFor(product.imageKeys[0] ?? "")}
                  alt={pick(product.name, lang)}
                  sizes="(min-width: 640px) 10rem, 90vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 pr-8">
                <h3 className="font-[family-name:var(--font-display)] text-lg text-charcoal">
                  {pick(product.name, lang)}
                </h3>
                <p className="font-mono text-[11px] text-charcoal/70">{product.code}</p>
                <p className="text-sm text-charcoal/70">
                  {product.purity ? (product.purity === "925" ? "Silver 925" : `${product.purity} gold`) : ""}
                  {product.purity && product.weightGrams ? " · " : ""}
                  {product.weightGrams ? `${product.weightGrams} g` : ""}
                </p>
                <p className="text-sm text-charcoal/70">{availabilityLabel(product, lang)}</p>
                <p className="font-medium text-maroon">
                  {product.priceType === "fixed" && product.priceINR !== null
                    ? `₹ ${formatINR(product.priceINR)}`
                    : product.availability === "sold_out"
                      ? pick({ en: "Not available", hi: "उपलब्ध नहीं" }, lang)
                      : t("catalogue.priceOnEnquiry")}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex flex-1 items-center justify-center rounded-sm bg-maroon px-3 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
              >
                {t("catalogue.viewDetails")}
              </Link>
              {enquiry ? (
                <a
                  href={enquiry}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-emerald-600/50 px-3 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-600/10"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t("catalogue.enquireWhatsapp")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
