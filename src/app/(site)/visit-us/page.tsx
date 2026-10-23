import type { Metadata } from "next";
import { CONTACT } from "@/lib/config";
import { buildMetadata, breadcrumbJsonLd, jewelryStoreJsonLd, jsonLdGraph } from "@/lib/seo";
import { VisitView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "Visit Us — Tulsi Jewellers, Hansapuri, Nagpur",
  description:
    "Visit the Tulsi Jewellers showroom in Hansapuri, Nagpur: address, opening hours, directions, call and WhatsApp, and a map you can load when you need it.",
  path: "/visit-us",
  image: imageSrc("showroomDisplay"),
  keywords: ["Tulsi Jewellers address", "jewellery showroom Hansapuri", "jewellery shop near me Nagpur"],
});

export default function VisitPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          jewelryStoreJsonLd("en"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Visit Us", path: "/visit-us" },
          ]),
          {
            "@type": "Place",
            name: "Tulsi Jewellers showroom",
            address: {
              "@type": "PostalAddress",
              addressLocality: CONTACT.area.en,
              addressRegion: "MH",
              addressCountry: "IN",
            },
          },
        ])}
      />
      <VisitView />
    </>
  );
}
