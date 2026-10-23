import type { Metadata } from "next";
import { GEMSTONES } from "@/lib/config";
import { getCatalogue } from "@/lib/catalogue/source";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { GemsView } from "@/components/views/catalogue-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "Gems / Ratna — Ruby, Pukhraj, Panna, Moti | Tulsi Jewellers",
  description:
    "Ruby, pukhraj, emerald, neelam, moti and amethyst at Tulsi Jewellers, Nagpur. Ask which stone you are shown and whether a certificate is provided.",
  path: "/gems",
  image: imageSrc("rubyRing"),
  keywords: [
    "ratna Nagpur",
    "gemstone shop Nagpur",
    "ruby manik Nagpur",
    "pukhraj Nagpur",
    "neelam panna Nagpur",
  ],
});

export default async function GemsPage() {
  const { products } = await getCatalogue();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Gems / Ratna", path: "/gems" },
          ]),
          {
            "@type": "ItemList",
            name: "Ratna / gemstones listed by Tulsi Jewellers",
            itemListElement: GEMSTONES.map((stone, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: stone.name.en,
            })),
          },
        ])}
      />
      <GemsView products={products} />
    </>
  );
}
