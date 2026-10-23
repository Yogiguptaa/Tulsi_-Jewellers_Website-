import type { Metadata } from "next";
import { buildMetadata, breadcrumbJsonLd, jewelryStoreJsonLd, jsonLdGraph } from "@/lib/seo";
import { ContactView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "Contact Tulsi Jewellers — Call, WhatsApp, Enquiry | Nagpur",
  description:
    "Contact Tulsi Jewellers in Hansapuri, Nagpur: call the showroom numbers, message on WhatsApp, or send an enquiry. No payments are taken on this website.",
  path: "/contact",
  image: imageSrc("showroomDisplay"),
  keywords: ["Tulsi Jewellers contact", "jewellery shop phone number Nagpur", "jewellery enquiry Nagpur"],
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          jewelryStoreJsonLd("en"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          {
            "@type": "ContactPage",
            name: "Contact Tulsi Jewellers",
            description: "Phone, WhatsApp and enquiry form for Tulsi Jewellers, Hansapuri, Nagpur.",
          },
        ])}
      />
      <ContactView />
    </>
  );
}
