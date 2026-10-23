import type { Metadata } from "next";
import { SCHEME } from "@/lib/config";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { SchemeView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "Gold Saving Scheme — Monthly Savings | Tulsi Jewellers",
  description:
    "A monthly gold saving scheme at Tulsi Jewellers, Hansapuri, Nagpur: save a fixed amount each month towards jewellery you choose. Join and pay at the showroom.",
  path: "/gold-saving-scheme",
  image: imageSrc("goldCoins"),
  keywords: [
    "gold saving scheme Nagpur",
    "jewellery monthly savings Nagpur",
    "swarna nidhi Nagpur",
    "gold scheme Tulsi Jewellers",
  ],
});

export default function SchemePage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Gold Saving Scheme", path: "/gold-saving-scheme" },
          ]),
          {
            "@type": "Service",
            name: SCHEME.name.en,
            description: `${SCHEME.tagline} — ${SCHEME.frequency.en} starting from ₹${SCHEME.startingAmountINR}. Enquiry and visit based; no online payments.`,
            serviceType: "Gold saving scheme",
            provider: { "@type": "JewelryStore", name: "Tulsi Jewellers" },
            areaServed: { "@type": "City", name: "Nagpur" },
          },
        ])}
      />
      <SchemeView />
    </>
  );
}
