import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, GUIDE_BY_SLUG } from "@/lib/content/guides";
import { breadcrumbJsonLd, buildMetadata, guideJsonLd, jsonLdGraph } from "@/lib/seo";
import { GuideDetailView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_BY_SLUG[slug];
  if (!guide) {
    return buildMetadata({
      title: "Guide not found | Tulsi Jewellers",
      description: "This guide is not available.",
      path: `/guides/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${guide.title.en} | Tulsi Jewellers`,
    description: guide.summary.en,
    path: `/guides/${slug}`,
    keywords: [guide.topic.en, "jewellery guide Nagpur"],
  });
}

/**
 * `params` is awaited here, with no Suspense boundary above it, so a missing
 * slug answers a real HTTP 404 instead of a streamed 200 carrying the
 * not-found text (a soft 404, which search engines index).
 */
export const instant = false;
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_BY_SLUG[slug];
  if (!guide) notFound();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          guideJsonLd({ title: guide.title.en, summary: guide.summary.en, slug: guide.slug }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Jewellery Guides", path: "/guides" },
            { name: guide.title.en, path: `/guides/${slug}` },
          ]),
        ])}
      />
      <GuideDetailView guide={guide} />
    </>
  );
}
