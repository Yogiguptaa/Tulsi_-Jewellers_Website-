import type { Metadata } from "next";
import { POLICY_BY_SLUG } from "@/lib/content/policies";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { PolicyView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

const policy = POLICY_BY_SLUG["returns-exchanges"];

export const metadata: Metadata = buildMetadata({
  title: "Returns & Exchanges | Tulsi Jewellers, Nagpur",
  description: "The returns and exchange position at Tulsi Jewellers, Nagpur. Commercial terms are shown as pending until the owner confirms them in writing.",
  path: "/returns-exchanges",
});

export default function PolicyPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: policy.title.en, path: "/returns-exchanges" },
          ]),
        ])}
      />
      <PolicyView policy={policy} />
    </>
  );
}
