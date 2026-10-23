import type { Metadata } from "next";
import { GUIDES } from "@/lib/content/guides";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { GuidesView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Gold Purity, Hallmarking & Gems Guides | Tulsi Jewellers",
  description:
    "Plain-language guides from Tulsi Jewellers, Nagpur: gold purity, hallmarking, gemstone basics and jewellery care, written to check facts before you buy.",
  path: "/guides",
  keywords: [
    "gold purity guide",
    "hallmark guide India",
    "gemstone basics",
    "jewellery care guide",
    "gold buying guide Nagpur",
  ],
});

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Jewellery Guides", path: "/guides" },
          ]),
          {
            "@type": "ItemList",
            name: "Jewellery guides",
            itemListElement: GUIDES.map((guide, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: guide.title.en,
              url: `/guides/${guide.slug}`,
            })),
          },
        ])}
      />
      <GuidesView />
    </>
  );
}
