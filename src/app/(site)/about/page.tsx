import type { Metadata } from "next";
import { CONTACT, SITE } from "@/lib/config";
import { breadcrumbJsonLd, buildMetadata, jewelryStoreJsonLd, jsonLdGraph } from "@/lib/seo";
import { AboutView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "About Tulsi Jewellers — Showroom in Hansapuri, Nagpur",
  description:
    "About Tulsi Jewellers, a jewellery showroom in Hansapuri, Nagpur: the collections it keeps, the saving scheme it runs, and the facts it has confirmed.",
  path: "/about",
  image: imageSrc("showroomAsian"),
  keywords: ["about Tulsi Jewellers", "jewellery showroom Hansapuri Nagpur"],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          jewelryStoreJsonLd("en"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" },
          ]),
          {
            "@type": "AboutPage",
            name: `About ${SITE.name.en}`,
            description: SITE.defaultMetaDescription,
            areaServed: CONTACT.area.en,
          },
        ])}
      />
      <AboutView />
    </>
  );
}
