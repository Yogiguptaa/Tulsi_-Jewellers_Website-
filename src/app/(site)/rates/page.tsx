import type { Metadata } from "next";
import { getRateHistory, getRatesSnapshot } from "@/lib/rates/service";
import { RATE_DISCLAIMER } from "@/lib/config";
import { breadcrumbJsonLd, buildMetadata, jsonLdGraph } from "@/lib/seo";
import { RatesView } from "@/components/views/rates-views";
import JsonLd from "@/components/seo/JsonLd";
import { imageSrc } from "@/lib/catalogue/images";

/** The range summarised on the main rates page. */
const SUMMARY_DAYS = 30;

export const metadata: Metadata = buildMetadata({
  title: "Gold & Silver Rates Today — Tulsi Jewellers, Nagpur",
  description:
    "Today's gold and silver rates at Tulsi Jewellers, Nagpur — with the source, date and time of every value, and making charges explained.",
  path: "/rates",
  image: imageSrc("goldCoins"),
  keywords: [
    "gold rate Nagpur today",
    "silver rate Nagpur today",
    "22K gold rate Nagpur",
    "916 gold rate",
    "Tulsi Jewellers rate",
  ],
});

export default async function RatesPage() {
  const [snapshot, history] = await Promise.all([
    getRatesSnapshot(),
    getRateHistory(SUMMARY_DAYS),
  ]);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Gold & Silver Rates", path: "/rates" },
          ]),
          {
            "@type": "WebPage",
            name: "Gold & Silver Rates",
            description: RATE_DISCLAIMER,
          },
        ])}
      />
      <RatesView
        snapshot={snapshot}
        historyDays={SUMMARY_DAYS}
        historyAvailable={history.available}
      />
    </>
  );
}
