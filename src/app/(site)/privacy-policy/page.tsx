import type { Metadata } from "next";
import { POLICY_BY_SLUG } from "@/lib/content/policies";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { PolicyView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

const policy = POLICY_BY_SLUG["privacy-policy"];

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy | Tulsi Jewellers, Nagpur",
  description: "What this website does with your data: the wishlist and language preference stay in your browser, and the enquiry form sends only what you type in it.",
  path: "/privacy-policy",
});

export default function PolicyPage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: policy.title.en, path: "/privacy-policy" },
          ]),
        ])}
      />
      <PolicyView policy={policy} />
    </>
  );
}
