import type { Metadata } from "next";
import { getFaqItems } from "@/lib/content/public-content";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd, jsonLdGraph } from "@/lib/seo";
import { FaqView } from "@/components/views/content-views";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Frequently Asked Questions — Tulsi Jewellers, Nagpur",
  description:
    "Straight answers about the Tulsi Jewellers showroom in Hansapuri, Nagpur: collections, visiting, delivery limits, published rates and the gold saving scheme.",
  path: "/faq",
  keywords: ["Tulsi Jewellers FAQ", "jewellery showroom questions Nagpur", "gold scheme questions Nagpur"],
});

export default async function FaqPage() {
  // Admin-managed FAQs when the owner has written any, otherwise the reviewed set
  // baked into src/lib/content/faq.ts.
  const items = await getFaqItems();

  // Every answer is rendered on the page, so the structured data mirrors the
  // visible content exactly (a Google requirement for FAQ rich results).
  const questions = items.map((item) => ({
    question: item.question.en,
    answer: item.answer.en,
  }));

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          faqJsonLd(questions),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ])}
      />
      <FaqView items={items} />
    </>
  );
}
