import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COLLECTIONS, pick } from "@/lib/config";
import { getCatalogue } from "@/lib/catalogue/source";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { CollectionDetailView } from "@/components/views/catalogue-views";
import JsonLd from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = COLLECTIONS.find((entry) => entry.slug === slug);
  if (!collection) {
    return buildMetadata({
      title: "Collection not found | Tulsi Jewellers",
      description: "This collection is not listed.",
      path: `/collections/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${collection.name.en} — Tulsi Jewellers, Nagpur`,
    description: `${collection.description.en} Visit the showroom in Hansapuri, Nagpur, or ask on WhatsApp what is available today.`,
    path: `/collections/${slug}`,
    keywords: [collection.name.en, "Tulsi Jewellers Nagpur", `${collection.name.en} Nagpur`],
  });
}

/**
 * `params` is awaited here, with no Suspense boundary above it, so a missing
 * slug can still be answered with its own metadata and a not-found view.
 */
export const instant = false;
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = COLLECTIONS.find((entry) => entry.slug === slug);
  if (!collection) notFound();

  const { products } = await getCatalogue();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Collections", path: "/collections" },
            { name: pick(collection.name, "en"), path: `/collections/${slug}` },
          ]),
        ])}
      />
      <CollectionDetailView collection={collection} products={products} />
    </>
  );
}
