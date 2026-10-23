import type { Metadata } from "next";
import { POLICY_BY_SLUG } from "@/lib/content/policies";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { PolicyView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

const policy = POLICY_BY_SLUG["delivery-information"];

export const metadata: Metadata = buildMetadata({
  title: "Delivery Information | Tulsi Jewellers, Nagpur",
  description: "How delivery and collection work at Tulsi Jewellers, Nagpur — including the plain statement that delivery outside Nagpur is not offered.",
  path: "/delivery-information",
});

export default function PolicyPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: policy.title.en, path: "/delivery-information" },
          ]),
        ])}
      />
      <PolicyView policy={policy} />
    </>
  );
}
