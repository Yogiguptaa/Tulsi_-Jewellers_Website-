import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DESIGNS, DESIGN_BY_SLUG } from "@/lib/designs";
import { buildMetadata, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { DesignDetailView } from "@/components/views/designs-views";
import JsonLd from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return DESIGNS.map((design) => ({ style: design.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ style: string }>;
}): Promise<Metadata> {
  const { style } = await params;
  const design = DESIGN_BY_SLUG[style];
  if (!design) {
    return buildMetadata({
      title: "Style not found | Tulsi Jewellers",
      description: "This style page is not available.",
      path: `/designs/${style}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${design.name.en} — Style Guide | Tulsi Jewellers`,
    description: design.summary.en,
    path: `/designs/${style}`,
    keywords: [design.name.en.toLowerCase(), "jewellery styles Nagpur"],
  });
}

/**
 * `params` is awaited with no Suspense boundary above it, so an unknown style
 * answers a real 404 instead of a streamed 200 (a soft 404).
 */
export const instant = false;

export default async function DesignPage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const design = DESIGN_BY_SLUG[style];
  if (!design) notFound();

  const related = DESIGNS.filter((entry) => entry.slug !== design.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Popular designs", path: "/designs" },
            { name: design.name.en, path: `/designs/${style}` },
          ]),
        ])}
      />
      <DesignDetailView design={design} related={related} />
    </>
  );
}
