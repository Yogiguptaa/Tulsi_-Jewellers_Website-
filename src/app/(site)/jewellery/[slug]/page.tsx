import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JEWEL_TYPES, JEWEL_TYPE_BY_SLUG } from "@/lib/catalogue/jewel-types";
import { getCatalogue } from "@/lib/catalogue/source";
import { pick } from "@/lib/config";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { designPhotosForType } from "@/lib/designs";
import { JewelleryTypeView } from "@/components/views/catalogue-views";
import JsonLd from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return JEWEL_TYPES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = JEWEL_TYPE_BY_SLUG[slug];
  if (!page) {
    return buildMetadata({
      title: "Page not found | Tulsi Jewellers",
      description: "This jewellery category is not listed.",
      path: `/jewellery/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${pick(page.name, "en")} in Nagpur — Tulsi Jewellers`,
    description: `${pick(page.description, "en")} Shop at Tulsi Jewellers, a jewellery showroom in Hansapuri, Nagpur.`,
    path: `/jewellery/${slug}`,
    keywords: [`${pick(page.name, "en")} Nagpur`, `buy ${pick(page.name, "en")} Hansapuri`],
  });
}

/**
 * `params` is awaited here, with no Suspense boundary above it, so a missing
 * slug answers a real HTTP 404 instead of a streamed 200 carrying the
 * not-found text (a soft 404, which search engines index).
 */
export const instant = false;
export default async function JewelleryTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = JEWEL_TYPE_BY_SLUG[slug];
  if (!page) notFound();

  const { products } = await getCatalogue();
  const designPhotos = designPhotosForType(slug);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Collections", path: "/collections" },
            { name: pick(page.name, "en"), path: `/jewellery/${slug}` },
          ]),
        ])}
      />
      <JewelleryTypeView page={page} products={products} designPhotos={designPhotos} />
    </>
  );
}
