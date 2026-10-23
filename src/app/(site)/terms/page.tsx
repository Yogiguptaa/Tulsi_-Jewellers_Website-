import type { Metadata } from "next";
import { POLICY_BY_SLUG } from "@/lib/content/policies";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { PolicyView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

const policy = POLICY_BY_SLUG["terms"];

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use | Tulsi Jewellers, Nagpur",
  description: "Terms for using the Tulsi Jewellers website, including how published rate information may be read and why nothing here is a quotation.",
  path: "/terms",
});

export default function PolicyPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: policy.title.en, path: "/terms" },
          ]),
        ])}
      />
      <PolicyView policy={policy} />
    </>
  );
}
