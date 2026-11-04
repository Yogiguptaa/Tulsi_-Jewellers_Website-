"use client";

import Link from "next/link";
import { ArrowRight, Gem } from "lucide-react";
import { COLLECTIONS, GEMSTONES, ROUTES, pick, type CollectionSeed } from "@/lib/config";
import { JEWEL_TYPES, type JewelTypePage } from "@/lib/catalogue/jewel-types";
import { getFeatured } from "@/lib/catalogue/select";
import { imageFor } from "@/lib/catalogue/images";
import Photo from "@/components/catalogue/Photo";
import type { Product } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import PageHero from "@/components/ui/PageHero";
import Notice from "@/components/ui/Notice";
import SectionHeading from "@/components/ui/SectionHeading";
import CatalogueBrowser from "@/components/catalogue/CatalogueBrowser";
import EmptyCatalogue from "@/components/catalogue/EmptyCatalogue";
import CollectionDesigns from "@/components/catalogue/CollectionDesigns";
import BangleShowcase from "@/components/content/BangleShowcase";
import { designPhotosForCollection, type DesignPhoto } from "@/lib/designs";

/** Photo used as the visual anchor for a collection tile, chosen by collection. */
const COLLECTION_IMAGE: Record<string, string> = {
  "gold-jewellery": "kadaMeenakari",
  "gold-coins": "goldCoins",
  "gold-biscuits": "goldBiscuit",
  "silver-jewellery": "silverDisplay",
  "diamond-jewellery": "diamondRingWhite",
  "fancy-jewellery": "bangleRubyDiamond",
  gems: "rubyRing",
};

/** /collections — the index of all six collections. */
export function CollectionsView({
  products,
}: {
  products: Product[];
}) {
  const { lang, t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("collections.kicker")}
        title={t("collections.title")}
        subtitle={t("collections.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.collections") }]}
      />

      <section className="container-page space-y-8 py-12 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection) => {
            const items = products.filter((product) => product.categorySlug === collection.slug);
            const photos = designPhotosForCollection(collection.slug);
            const cover = COLLECTION_IMAGE[collection.slug] ?? photos[0]?.key;
            return (
              <li key={collection.slug}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group flex h-full flex-col overflow-hidden border border-gold/25 bg-offwhite transition-shadow hover:shadow-soft"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-champagne/60 via-offwhite to-gold/25">
                    {cover ? (
                      <Photo
                        image={imageFor(cover)}
                        alt=""
                        sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 92vw"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    ) : (
                      // No photograph for this collection yet. Rather than an
                      // empty pale box, a deliberate gold plate with the mark
                      // centred — it reads as a design choice, not a missing file.
                      <span className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_srgb,var(--color-gold)_28%,transparent),transparent_70%)]">
                        <span className="absolute inset-6 rounded-full border border-gold/30" aria-hidden="true" />
                        <span className="absolute inset-12 rounded-full border border-gold/20" aria-hidden="true" />
                        <Gem className="h-12 w-12 text-gold-600/80" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-2 p-5">
                    <Gem className="h-5 w-5 text-gold-600" aria-hidden="true" />
                    <span className="font-[family-name:var(--font-display)] text-xl">
                      {pick(collection.name, lang)}
                    </span>
                    <span className="text-sm text-charcoal/70">
                      {pick(collection.description, lang)}
                    </span>
                    <span className="mt-auto inline-flex items-center justify-between gap-2 pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-maroon">
                        {t("collections.explore")}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {items.length > 0 ? (
                        <span className="text-[11px] text-charcoal/70">
                          {t("collections.count", { count: items.length })}
                        </span>
                      ) : photos.length > 0 ? (
                        <span className="text-[11px] text-charcoal/70">
                          {t("designStyles.count", { count: photos.length })}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="space-y-4">
          <SectionHeading
            align="left"
            title={t("catalogue.browseByType")}
            subtitle={t("catalogue.typeChipsLabel")}
          />
          <nav aria-label={t("catalogue.typeChipsLabel")} className="flex flex-wrap gap-2">
            {JEWEL_TYPES.map((type) => (
              <Link
                key={type.slug}
                href={`/jewellery/${type.slug}`}
                className="rounded-full border border-gold/40 px-3.5 py-1.5 text-sm text-charcoal/80 hover:border-maroon hover:text-maroon"
              >
                {pick(type.chip, lang)}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}

/** /collections/[slug] */
export function CollectionDetailView({
  collection,
  products,
  designPhotos,
}: {
  collection: CollectionSeed;
  products: Product[];
  designPhotos: DesignPhoto[];
}) {
  const { lang, t } = useLanguage();
  const items = products.filter((product) => product.categorySlug === collection.slug);

  return (
    <>
      <PageHero
        kicker={t("collections.kicker")}
        title={pick(collection.name, lang)}
        subtitle={pick(collection.description, lang)}
        crumbs={[
          { href: ROUTES.home, label: t("common.home") },
          { href: ROUTES.collections, label: t("nav.collections") },
          { label: pick(collection.name, lang) },
        ]}
      />

      <section className="container-page space-y-10 py-12 sm:py-16">
        {/* The design wall comes first: it is the part of this page that has
            something to look at even before the first product row is published. */}
        <CollectionDesigns photos={designPhotos} />

        {items.length > 0 ? <CatalogueBrowser products={items} showTypeChips /> : null}

        {items.length === 0 ? (
          <div className="space-y-4">
            {designPhotos.length === 0 ? <EmptyCatalogue /> : null}
            <div className="text-center">
              <Link
                href={ROUTES.collections}
                className="text-sm font-medium text-maroon underline underline-offset-4"
              >
                {t("catalogue.backToCollections")}
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

/** /jewellery/[slug] — a type, gender or occasion landing page. */
export function JewelleryTypeView({
  page,
  products,
  designPhotos,
}: {
  page: JewelTypePage;
  products: Product[];
  designPhotos: DesignPhoto[];
}) {
  const { lang, t } = useLanguage();
  const featured = getFeatured(products, 4);

  return (
    <>
      <PageHero
        kicker={t("collections.kicker")}
        title={pick(page.name, lang)}
        subtitle={pick(page.description, lang)}
        crumbs={[
          { href: ROUTES.home, label: t("common.home") },
          { href: ROUTES.collections, label: t("nav.collections") },
          { label: pick(page.chip, lang) },
        ]}
      />

      {/* The bangle room belongs on the bangle landing page too — it is the
          only place a visitor sees the four styles together. */}
      {page.slug === "bangles" ? <BangleShowcase /> : null}

      <section className="container-page space-y-10 py-12 sm:py-16">
        <CollectionDesigns photos={designPhotos} />

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featured.map((product) => (
              <Link
                key={product.code}
                href={`/products/${product.slug}`}
                className="group overflow-hidden border border-gold/25 bg-offwhite"
              >
                <span className="block aspect-square overflow-hidden bg-champagne/25">
                  <Photo
                    image={imageFor(product.imageKeys[0] ?? "")}
                    alt=""
                    sizes="(min-width: 640px) 24vw, 46vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                </span>
                <span className="block px-3 py-2 text-xs text-charcoal/80">
                  {pick(product.name, lang)}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {products.length > 0 ? (
          <CatalogueBrowser products={products} showTypeChips={false} />
        ) : designPhotos.length === 0 ? (
          <EmptyCatalogue />
        ) : null}
      </section>
    </>
  );
}

/** /gems — the ratna collection with its own stone filter and honesty notice. */
export function GemsView({
  products,
  designPhotos,
}: {
  products: Product[];
  designPhotos: DesignPhoto[];
}) {
  const { lang, t } = useLanguage();
  const gems = products.filter((product) => product.metal === "gemstone" || product.gemstone !== null);

  return (
    <>
      <PageHero
        kicker={t("gems.kicker")}
        title={t("gems.title")}
        subtitle={t("gems.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.gems") }]}
      />

      <section className="container-page space-y-8 py-12 sm:py-16">
        <Notice tone="info" title={t("gems.disclaimerTitle")}>
          {t("gems.disclaimerBody")}
        </Notice>

        {/* The stones the showroom lists. Selecting one is done with the stone
            filter inside the browser below, which keeps a single source of truth
            for what is actually filtered. */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">
            {t("catalogue.filterStone")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {GEMSTONES.map((stone) => (
              <li
                key={stone.slug}
                className="rounded-full border border-gold/35 bg-offwhite px-3.5 py-1.5 text-sm text-charcoal/80"
              >
                {pick(stone.name, lang)}
              </li>
            ))}
          </ul>
        </div>

        {gems.length > 0 ? (
          <CatalogueBrowser products={gems} showTypeChips={false} />
        ) : null}

        <CollectionDesigns photos={designPhotos} />
      </section>
    </>
  );
}
