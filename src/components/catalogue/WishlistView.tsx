"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Scale, Share2, Trash2 } from "lucide-react";
import { ROUTES, SITE, pick, whatsappHref } from "@/lib/config";
import { formatINR } from "@/lib/rates/format";
import { getByIds } from "@/lib/catalogue/select";
import type { Product } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { writeWishlist, useWishlist } from "@/lib/wishlist";
import ProductGrid from "./ProductGrid";
import Notice from "@/components/ui/Notice";

/**
 * The wishlist lives in localStorage only, so this view receives the whole
 * catalogue and filters it by the saved codes on the client. No account, no
 * server call and nothing about the visitor is transmitted — which is what the
 * privacy policy states.
 */
const AVAILABILITY_LABEL: Record<Product["availability"], { en: string; hi: string }> = {
  in_stock: { en: "Available in showroom", hi: "शोरूम में उपलब्ध" },
  on_enquiry: { en: "Ask us", hi: "हमसे पूछें" },
  sold_out: { en: "Not available right now", hi: "अभी उपलब्ध नहीं" },
};

const MAX_COMPARE = 3;

export default function WishlistView({ products }: { products: Product[] }) {
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const { codes } = useWishlist();
  const [compareCodes, setCompareCodes] = useState<string[]>([]);

  const saved = getByIds(products, codes);
  const missing = codes.length - saved.length;

  const compare = saved.filter((product) => compareCodes.includes(product.code));
  const toggleCompare = (code: string) =>
    setCompareCodes((current) =>
      current.includes(code)
        ? current.filter((entry) => entry !== code)
        : current.length >= MAX_COMPARE
          ? current
          : [...current, code],
    );

  // The share text names the saved pieces and links to the wishlist page. It is
  // the visitor who presses send — nothing is transmitted by the site itself.
  const shareText =
    saved.length > 0
      ? [
          `${pick(SITE.name, lang)} — ${t("wishlist.title")}`,
          ...saved.map((product) => `• ${pick(product.name, lang)} (${product.code})`),
          SITE.baseUrl.replace(/\/$/, "") + ROUTES.wishlist,
        ].join("\n")
      : null;
  const shareHref = shareText ? whatsappHref(shareText) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-charcoal/70">{t("wishlist.itemCount", { count: saved.length })}</p>
        {saved.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {shareHref ? (
              <a
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-maroon px-3 py-2 text-sm font-medium text-offwhite hover:bg-maroon-700"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {t("wishlist.share")}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => {
                writeWishlist([]);
                setCompareCodes([]);
                toast(t("wishlist.cleared"));
              }}
              className="inline-flex items-center gap-2 rounded-sm border border-maroon/40 px-3 py-2 text-sm text-maroon hover:bg-maroon/5"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("wishlist.clear")}
            </button>
          </div>
        ) : null}
      </div>

      {saved.length > 0 ? (
        <p className="text-xs text-charcoal/70">{t("wishlist.shareNote")}</p>
      ) : null}

      {missing > 0 ? <Notice tone="info">{t("wishlist.missing")}</Notice> : null}

      {saved.length === 0 ? (
        <div className="border border-dashed border-gold/50 bg-offwhite/60 p-10 text-center">
          <Heart className="mx-auto h-6 w-6 text-gold-600" aria-hidden="true" />
          <p className="mt-3 font-[family-name:var(--font-display)] text-xl">
            {t("wishlist.emptyTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/70">{t("wishlist.emptyBody")}</p>
          <Link
            href={ROUTES.collections}
            className="mt-4 inline-block rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
          >
            {t("nav.collections")}
          </Link>
        </div>
      ) : (
        <>
          {/* Compare: pick up to three saved pieces and see purity, weight,
              availability and price side by side. Every cell is a fact from the
              catalogue entry; nothing is calculated or inferred. */}
          <div className="space-y-3 border border-gold/25 bg-offwhite p-4">
            <h2 className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg text-maroon">
              <Scale className="h-4 w-4 text-gold-600" aria-hidden="true" />
              {t("compare.title")}
            </h2>
            <p className="text-xs text-charcoal/70">{t("compare.hint")}</p>
            <div className="flex flex-wrap gap-2">
              {saved.map((product) => {
                const picked = compareCodes.includes(product.code);
                return (
                  <button
                    key={product.code}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => toggleCompare(product.code)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      picked
                        ? "border-maroon bg-maroon text-offwhite"
                        : "border-gold/40 bg-offwhite text-charcoal/80 hover:border-maroon hover:text-maroon"
                    }`}
                  >
                    {pick(product.name, lang)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-charcoal/70">
              {t("compare.selected", { count: compareCodes.length })}
            </p>

            {compare.length >= 2 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <caption className="sr-only">{t("compare.title")}</caption>
                  <thead>
                    <tr className="border-b border-gold/40 text-left text-[11px] uppercase tracking-[0.12em] text-charcoal/70">
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        {t("compare.field")}
                      </th>
                      {compare.map((product) => (
                        <th key={product.code} scope="col" className="py-2 pr-4 font-semibold">
                          <Link href={`/products/${product.slug}`} className="text-maroon hover:underline">
                            {pick(product.name, lang)}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/20">
                    <tr>
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-charcoal/70">
                        {t("catalogue.purity")}
                      </th>
                      {compare.map((product) => (
                        <td key={product.code} className="py-2 pr-4">
                          {product.purity ? (product.purity === "925" ? "Silver 925" : `${product.purity} gold`) : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-charcoal/70">
                        {t("catalogue.weight")}
                      </th>
                      {compare.map((product) => (
                        <td key={product.code} className="py-2 pr-4">
                          {product.weightGrams ? `${product.weightGrams} g` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-charcoal/70">
                        {t("compare.availability")}
                      </th>
                      {compare.map((product) => (
                        <td key={product.code} className="py-2 pr-4">
                          {pick(AVAILABILITY_LABEL[product.availability], lang)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-charcoal/70">
                        {t("compare.price")}
                      </th>
                      {compare.map((product) => (
                        <td key={product.code} className="py-2 pr-4">
                          {product.priceType === "fixed" && product.priceINR !== null
                            ? `₹ ${formatINR(product.priceINR)}`
                            : product.availability === "sold_out"
                              ? pick({ en: "Not available", hi: "उपलब्ध नहीं" }, lang)
                              : t("catalogue.priceOnEnquiry")}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => setCompareCodes([])}
                  className="mt-3 text-xs text-maroon underline underline-offset-4"
                >
                  {t("compare.clear")}
                </button>
              </div>
            ) : null}
          </div>

          <ProductGrid products={saved} />
        </>
      )}

      <p className="text-xs text-charcoal/70">{t("wishlist.localNote")}</p>
    </div>
  );
}
