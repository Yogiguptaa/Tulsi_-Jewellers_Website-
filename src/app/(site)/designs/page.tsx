import type { Metadata } from "next";
import { DESIGNS } from "@/lib/designs";
import { imageSrc } from "@/lib/catalogue/images";
import { buildMetadata, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { DesignsIndexView } from "@/components/views/designs-views";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Popular Jewellery Designs — Bridal, Temple, Kundan, Bangles | Tulsi Jewellers",
  description:
    "Popular Indian jewellery styles explained: bridal sets, temple jewellery, kundan and polki, jhumkas, kadas, mangalsutra, chains, diamond rings, silver and coins. Style information, not stock.",
  path: "/designs",
  image: imageSrc("bridePortrait"),
  keywords: [
    "bridal necklace set Nagpur",
    "temple jewellery Nagpur",
    "kundan polki Nagpur",
    "jhumka earrings Nagpur",
    "gold kada Nagpur",
    "mangalsutra designs Nagpur",
  ],
});

export default function DesignsPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Popular designs", path: "/designs" },
          ]),
        ])}
      />
      <DesignsIndexView designs={DESIGNS} />
    </>
  );
}
