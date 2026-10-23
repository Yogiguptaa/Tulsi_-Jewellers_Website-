"use client";

import { ROUTES } from "@/lib/config";
import type { Product } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import PageHero from "@/components/ui/PageHero";
import WishlistView from "@/components/catalogue/WishlistView";

/**
 * /wishlist. The header is translated on the client, while the saved items
 * themselves are resolved in the browser from the catalogue passed in.
 */
export function WishlistPageView({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        kicker={t("nav.wishlist")}
        title={t("wishlist.title")}
        subtitle={t("wishlist.subtitle")}
        crumbs={[{ href: ROUTES.home, label: t("common.home") }, { label: t("nav.wishlist") }]}
      />
      <section className="container-page py-12 sm:py-16">
        <WishlistView products={products} />
      </section>
    </>
  );
}
