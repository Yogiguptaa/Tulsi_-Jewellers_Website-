import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogue } from "@/lib/catalogue/source";
import { imageSrc } from "@/lib/catalogue/images";
import { buildMetadata, jsonLdGraph, productJsonLd } from "@/lib/seo";
import ProductDetailView from "@/components/views/ProductDetailView";
import JsonLd from "@/components/seo/JsonLd";

/*
 * No `generateStaticParams` here on purpose. Product slugs come from the
 * database, which can legitimately be empty (before the showroom publishes its
 * own photographed pieces), and Cache Components rejects an empty result set at
 * build time. The route is therefore rendered on demand and cached by the
 * catalogue read inside it — and opt out of instant-navigation validation,
 * because the site chrome above it reads the path.
 */
export const instant = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalogue();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) {
    return buildMetadata({
      title: "Item not found | Tulsi Jewellers",
      description: "This item is no longer listed.",
      path: `/products/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${product.name.en} — Tulsi Jewellers, Nagpur`,
    description:
      `${product.name.en} (item code ${product.code}). ${product.description.en}`.slice(0, 300) ||
      "Contact Tulsi Jewellers, Hansapuri, Nagpur for details.",
    path: `/products/${slug}`,
    image: product.imageKeys[0] ? imageSrc(product.imageKeys[0]) : undefined,
    keywords: [product.name.en, `item ${product.code}`, "Tulsi Jewellers Nagpur"],
  });
}

/**
 * `params` is awaited in the page itself, with no Suspense boundary above it, so
 * `notFound()` can still answer a real HTTP 404. Streaming the body first would
 * flush a 200 with the not-found text inside it — a soft 404 that search engines
 * index and customers see as a broken item.
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getCatalogue();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          productJsonLd({
            name: product.name.en,
            description: product.description.en,
            slug: product.slug,
            code: product.code,
            image: product.imageKeys[0] ? imageSrc(product.imageKeys[0]) : undefined,
            priceINR: product.priceINR,
            brandName: "Tulsi Jewellers",
          }),
        ])}
      />
      <ProductDetailView product={product} catalogue={products} />
    </>
  );
}
