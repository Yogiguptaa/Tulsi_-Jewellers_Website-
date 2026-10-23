import type { MetadataRoute } from "next";
import { COLLECTIONS, FOOTER_POLICY_LINKS, ROUTES } from "@/lib/config";
import { JEWEL_TYPES } from "@/lib/catalogue/jewel-types";
import { GUIDES } from "@/lib/content/guides";
import { getCatalogue } from "@/lib/catalogue/source";
import { absoluteUrl } from "@/lib/seo";

/**
 * Every indexable route. Pages that are deliberately not indexed — the wishlist
 * (browser-only data) and the image-credits notice — are left out, matching the
 * `noIndex` flag in their metadata.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalogue();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl(ROUTES.home), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(ROUTES.collections), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl(ROUTES.rates), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/rates/history"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/rates/calculator"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl(ROUTES.gems), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl(ROUTES.scheme), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl(ROUTES.about), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl(ROUTES.visit), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl(ROUTES.contact), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl(ROUTES.faq), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/guides"), changeFrequency: "monthly", priority: 0.6 },
  ];

  const collectionRoutes: MetadataRoute.Sitemap = COLLECTIONS.map((collection) => ({
    url: absoluteUrl(`/collections/${collection.slug}`),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const typeRoutes: MetadataRoute.Sitemap = JEWEL_TYPES.map((type) => ({
    url: absoluteUrl(`/jewellery/${type.slug}`),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.slug}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const policyRoutes: MetadataRoute.Sitemap = FOOTER_POLICY_LINKS.map((link) => ({
    url: absoluteUrl(link.href),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [
    ...staticRoutes,
    ...collectionRoutes,
    ...typeRoutes,
    ...productRoutes,
    ...guideRoutes,
    ...policyRoutes,
  ];
}
