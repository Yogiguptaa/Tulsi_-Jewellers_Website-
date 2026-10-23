import type { Metadata } from "next";
import { buildMetadata, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { ImageCreditsView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Image Credits | Tulsi Jewellers",
  description:
    "Licence and attribution for the stock photographs used for design inspiration on this site, with a link to each original file.",
  path: "/image-credits",
  noIndex: true,
});

export default function ImageCreditsPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Image credits", path: "/image-credits" },
          ]),
        ])}
      />
      <ImageCreditsView />
    </>
  );
}
