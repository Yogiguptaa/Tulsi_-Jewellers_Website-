"use client";

import Link from "next/link";
import { Heart, MessageCircle, Phone, ShieldAlert, Tag } from "lucide-react";
import {
  COLLECTIONS,
  CONTACT,
  DELIVERY,
  GEMSTONES,
  ROUTES,
  SITE,
  pick,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import { formatINR } from "@/lib/rates/format";
import { imageCredit, imageFor } from "@/lib/catalogue/images";
import { JEWEL_TYPE_BY_SLUG } from "@/lib/catalogue/jewel-types";
import { getRelated } from "@/lib/catalogue/select";
import type { Product } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useWishlist } from "@/lib/wishlist";
import PageHero from "@/components/ui/PageHero";
import Notice from "@/components/ui/Notice";
import ShareRow from "@/components/catalogue/ShareRow";
import ProductGallery from "@/components/catalogue/ProductGallery";
import ProductGrid from "@/components/catalogue/ProductGrid";
import EnquiryForm from "@/components/forms/EnquiryForm";

const SOLD_OUT = { en: "Not available right now", hi: "अभी उपलब्ध नहीं" };

/**
 * Product page. A real price is shown only when the showroom supplied one;
 * everything else reads "Price on Enquiry". Weight, purity and stone details are
 * printed exactly as supplied — never estimated from the photo.
 */
export default function ProductDetailView({
  product,
  catalogue,
}: {
  product: Product;
  catalogue: Product[];
}) {
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const { has, toggle } = useWishlist();
  const saved = has(product.code);

  const collection = COLLECTIONS.find((entry) => entry.slug === product.categorySlug);
  const type = JEWEL_TYPE_BY_SLUG[product.type];
  const gemstone = GEMSTONES.find((entry) => entry.slug === product.gemstone);
  const related = getRelated(catalogue, product, 4);

  const images = (product.imageKeys.length > 0 ? product.imageKeys : [""]).map((key) => ({
    image: imageFor(key),
    credit: imageCredit(key)?.credit ?? null,
  }));

  const shareUrl = `${SITE.baseUrl.replace(/\/$/, "")}/products/${product.slug}`;
  const enquiry = whatsappHref(
    `Hello Tulsi Jewellers, I am interested in ${product.name.en} (${product.code}). ` +
      "Please share the availability, weight and price.",
  );
  const phone = CONTACT.phones[0];

  return (
    <>
      <PageHero
        title={pick(product.name, lang)}
        crumbs={[
          { href: ROUTES.home, label: t("common.home") },
          { href: ROUTES.collections, label: t("nav.collections") },
          ...(collection
            ? [
                {
                  href: `/collections/${collection.slug}`,
                  label: pick(collection.name, lang),
                },
              ]
            : []),
          { label: pick(product.name, lang) },
        ]}
      />

      <section className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <ProductGallery
          images={images}
          alt={pick(product.name, lang)}
          label={(index, total) => t("catalogue.galleryLabel", { index, total })}
        />

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.availability === "sold_out" ? (
              <span className="rounded-sm border border-maroon/40 bg-offwhite px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-maroon">
                {pick(SOLD_OUT, lang)}
              </span>
            ) : null}
            {type ? (
              <Link
                href={`/jewellery/${type.slug}`}
                className="rounded-sm border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-charcoal/70 hover:text-maroon"
              >
                {pick(type.chip, lang)}
              </Link>
            ) : null}
          </div>

          <div className="space-y-2">
            {/* The page <h1> lives in the hero above; repeating it here as a
                heading would give the document two top-level headings. */}
            <p className="font-[family-name:var(--font-display)] text-2xl leading-tight text-charcoal sm:text-3xl">
              {pick(product.name, lang)}
            </p>
            <p className="inline-flex items-center gap-2 font-mono text-xs text-charcoal/70">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              {product.code}
            </p>
          </div>

          <p className="text-2xl font-medium text-maroon">
            {product.priceType === "fixed" && product.priceINR !== null
              ? `₹ ${formatINR(product.priceINR)}`
              : product.availability === "sold_out"
                ? t("common.notAvailable")
                : t("catalogue.priceOnEnquiry")}
          </p>

          <p className="text-sm leading-relaxed text-charcoal/80">
            {pick(product.description, lang)}
          </p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-gold/25 py-4 text-sm">
            {product.purity ? (
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-charcoal/70">
                  {t("catalogue.purity")}
                </dt>
                <dd className="text-charcoal/85">
                  {product.purity === "925" ? "Silver 925" : `${product.purity} gold`}
                </dd>
              </div>
            ) : null}
            {product.weightGrams !== null ? (
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-charcoal/70">
                  {t("catalogue.weight")}
                </dt>
                <dd className="text-charcoal/85">{product.weightGrams} g</dd>
              </div>
            ) : null}
            {gemstone ? (
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-charcoal/70">
                  {t("catalogue.filterStone")}
                </dt>
                <dd className="text-charcoal/85">{pick(gemstone.name, lang)}</dd>
              </div>
            ) : null}
            {product.stoneDetail ? (
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-[0.12em] text-charcoal/70">
                  {t("catalogue.stoneDetails")}
                </dt>
                <dd className="text-charcoal/85">{product.stoneDetail}</dd>
              </div>
            ) : null}
          </dl>

          {product.specs.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">
                {t("catalogue.specifications")}
              </h2>
              <dl className="grid gap-2 sm:grid-cols-2">
                {product.specs.map((spec) => (
                  <div key={spec.label.en} className="flex justify-between gap-3 border border-gold/20 bg-offwhite px-3 py-2 text-sm">
                    <dt className="text-charcoal/70">{pick(spec.label, lang)}</dt>
                    <dd className="text-charcoal/85">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                toggle(product.code);
                toast(saved ? t("catalogue.wishlistRemove") : t("catalogue.wishlistAdd"));
              }}
              aria-pressed={saved}
              className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-maroon text-maroon" : ""}`} aria-hidden="true" />
              {saved ? t("catalogue.wishlistRemove") : t("catalogue.wishlistAdd")}
            </button>
            {enquiry ? (
              <a
                href={enquiry}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("catalogue.enquireWhatsapp")}
              </a>
            ) : null}
            <a
              href={telHref(phone.number)}
              className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {telDisplay(phone.number)}
            </a>
          </div>

          <ShareRow url={shareUrl} title={pick(product.name, lang)} />

          <Notice tone="info" title={t("home.deliveryTitle")}>
            {DELIVERY.outsideNagpurNote}
          </Notice>

          {product.availability === "sold_out" ? (
            <p className="flex items-start gap-2 text-xs text-charcoal/70">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-maroon" aria-hidden="true" />
              {lang === "hi"
                ? "यह वस्तु अभी उपलब्ध नहीं है। शोरूम से मिलती-जुलती वस्तुएँ पूछें।"
                : "This item is not available right now. Ask the showroom about similar pieces."}
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-t border-gold/20 bg-offwhite/70">
        <div className="container-page py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
            <div className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
                {t("catalogue.specifications")}
              </h2>
              <p className="max-w-xl text-sm text-charcoal/75">
                {lang === "hi"
                  ? "इस वस्तु के बारे में कोई भी जानकारी पूछें — उपलब्धता, वज़न, शुद्धता, बनावट या कीमत। शोरूम सीधे उत्तर देगा।"
                  : "Ask anything about this item — availability, weight, purity, making or price. The showroom answers directly."}
              </p>
            </div>
            <EnquiryForm
              kind="product"
              productCode={product.code}
              context={`${pick(product.name, lang)} (${product.code})`}
              title={t("enquiry.title")}
            />
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="container-page py-12 sm:py-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">
            {t("catalogue.related")}
          </h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}

      <section className="container-page pb-12">
        <Link
          href={ROUTES.collections}
          className="text-sm font-medium text-maroon underline underline-offset-4"
        >
          {t("catalogue.backToCollections")}
        </Link>
      </section>
    </>
  );
}
