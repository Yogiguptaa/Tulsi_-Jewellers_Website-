import type { Metadata } from "next";
import { getCatalogue } from "@/lib/catalogue/source";
import { getRatesSnapshot } from "@/lib/rates/service";
import { toApiPayload } from "@/lib/rates/api-payload";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { getPublicReviews } from "@/lib/content/public-content";
import {
  buildMetadata,
  collectionsJsonLd,
  faqJsonLd,
  jewelryStoreJsonLd,
  jsonLdGraph,
} from "@/lib/seo";
import HomeView from "@/components/views/HomeView";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

export const metadata: Metadata = buildMetadata({
  title: "Tulsi Jewellers — Jewellery Showroom in Hansapuri, Nagpur",
  description:
    "Gold jewellery, silver, gold coins and ratna (gems) at Tulsi Jewellers, Hansapuri, Nagpur — with today's benchmark rate and a scheme from ₹499 a month.",
  path: "/",
  image: imageSrc("showroomAsian"),
  keywords: [
    "jewellery showroom Nagpur",
    "Tulsi Jewellers Hansapuri",
    "gold jewellery Nagpur",
    "gold rate Nagpur",
    "silver rate Nagpur",
    "gold saving scheme Nagpur",
    "ratna gems Nagpur",
  ],
});

export default async function HomePage() {
  // Both reads are cached (`use cache`) and invalidated by the admin actions, so
  // an approved review or a new product appears on the next request.
  const [{ products, source }, reviews, rates] = await Promise.all([
    getCatalogue(),
    getPublicReviews(),
    getRatesSnapshot(),
  ]);

  // Home-page FAQ preview mirrors the five questions rendered in HomeView.
  const faqPreview = FAQ_ITEMS.filter((item) =>
    ["where", "what-sell", "delivery-outside", "rates", "scheme"].includes(item.id),
  ).map((item) => ({ question: item.question.en, answer: item.answer.en }));

  return (
    <>
      <JsonLd
        data={jsonLdGraph([jewelryStoreJsonLd("en"), collectionsJsonLd("en"), faqJsonLd(faqPreview)])}
      />
      <HomeView
        products={products}
        source={source}
        reviews={reviews}
        initialRates={toApiPayload(rates)}
      />
    </>
  );
}
