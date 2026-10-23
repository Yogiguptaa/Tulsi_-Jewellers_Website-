import type { Metadata } from "next";
import { getRatesSnapshot } from "@/lib/rates/service";
import { resolveProvider } from "@/lib/rates/providers";
import { buildMetadata, breadcrumbJsonLd, jsonLdGraph } from "@/lib/seo";
import { CalculatorView } from "@/components/views/rates-views";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Metal Value Calculator — From Today's Rate | Tulsi Jewellers",
  description:
    "Estimate the metal value of a gold or silver piece from our published benchmark rate. An estimate of metal value only — never a price and never a quotation.",
  path: "/rates/calculator",
  keywords: ["gold value calculator Nagpur", "jewellery metal value calculator", "gold price calculator India"],
});

/**
 * Customer-facing only. Provider names, environment variables and setup
 * problems belong in the admin panel and the server log, never on a public page.
 */
function customerRateNote(): string | null {
  const resolution = resolveProvider();
  if (resolution.problem || resolution.active.kind !== "external") return null;

  const freshness =
    resolution.active.publication === "intraday"
      ? "It is refreshed through the day, and the time of the latest update is shown with the rate."
      : "It is refreshed once a day, and the date and time of the stored rate are always shown.";
  const customerNote = resolution.active.customerNote ? ` ${resolution.active.customerNote}` : "";
  return `International market prices, converted to rupees. ${freshness}${customerNote}`;
}

export default async function CalculatorPage() {
  const snapshot = await getRatesSnapshot();

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Gold & Silver Rates", path: "/rates" },
            { name: "Metal value calculator", path: "/rates/calculator" },
          ]),
        ])}
      />
      <CalculatorView snapshot={snapshot} providerNote={customerRateNote()} />
    </>
  );
}
