import type { Metadata } from "next";
import { getRateHistory } from "@/lib/rates/service";
import { buildMetadata, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { RateHistoryView } from "@/components/views/rates-views";
import JsonLd from "@/components/seo/JsonLd";

/** How far back the chart looks. */
const HISTORY_DAYS = 90;

export const metadata: Metadata = buildMetadata({
  title: "Gold & Silver Rate History | Tulsi Jewellers",
  description:
    "Day-by-day gold and silver rates recorded by Tulsi Jewellers, Nagpur — plotted only from the values the showroom actually recorded.",
  path: "/rates/history",
  keywords: ["gold rate history Nagpur", "gold price chart Nagpur", "silver rate history Nagpur"],
});

export default async function RateHistoryPage() {
  const history = await getRateHistory(HISTORY_DAYS);
  const notice = history.available
    ? null
    : "No rate has been recorded for this period yet. The chart shows data only once the showroom publishes a rate.";

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Gold & Silver Rates", path: "/rates" },
            { name: "Rate history", path: "/rates/history" },
          ]),
        ])}
      />
      <RateHistoryView rows={history.rows} days={HISTORY_DAYS} notice={notice} />
    </>
  );
}
