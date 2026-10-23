import type { Metadata } from "next";
import { getCatalogue } from "@/lib/catalogue/source";
import { buildMetadata, breadcrumbJsonLd, collectionsJsonLd, jsonLdGraph } from "@/lib/seo";
import { CollectionsView } from "@/components/views/catalogue-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "Collections — Gold, Silver, Coins & Gems | Tulsi Jewellers",
  description:
    "Browse the Tulsi Jewellers collections: gold jewellery, gold coins and biscuits, silver, fancy jewellery and a ratna (gems) range.",
  path: "/collections",
  image: imageSrc("kadaMeenakari"),
  keywords: [
    "gold jewellery collections Nagpur",
    "silver jewellery Nagpur",
    "gold coins Nagpur",
    "fancy jewellery Nagpur",
    "gems ratna Nagpur",
  ],
});

export default async function CollectionsPage() {
  const { products } = await getCatalogue();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          collectionsJsonLd("en"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Collections", path: "/collections" },
          ]),
        ])}
      />
      <CollectionsView products={products} />
    </>
  );
}
