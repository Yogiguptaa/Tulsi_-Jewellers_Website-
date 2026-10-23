"use client";

import { useMemo, useState } from "react";
import { Calculator, Info, MessageCircle, Phone } from "lucide-react";
import {
  CONTACT,
  MAKING_CHARGES_NOTE,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import { formatINR, formatRate, formatDateTime } from "@/lib/rates/format";
import { estimate, type CalculatorInput } from "@/lib/rates/calculator";
import type { RateLine, RateObservation, RatesSnapshot } from "@/lib/rates/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Notice from "@/components/ui/Notice";

type Props = {
  snapshot: RatesSnapshot;
};

/**
 * Metal-value estimator.
 *
 * Only the metal value is calculated: rate × weight. Making charges, wastage,
 * stones and taxes are deliberately not estimated — they depend on the piece and
 * are confirmed at the shop — so the page says so and offers a WhatsApp/call
 * button instead of inventing a total.
 */
export default function GoldCalculator({ snapshot }: Props) {
  const { lang, t } = useLanguage();

  const lines = useMemo(
    () => snapshot.lines.filter((line) => line.latest && line.latest.rate > 0),
    [snapshot.lines],
  );

  const [lineId, setLineId] = useState<string>(lines[0]?.row.id ?? "");
  const [weight, setWeight] = useState("8");

  const line: RateLine | undefined = lines.find((entry) => entry.row.id === lineId) ?? lines[0];
  const weightGrams = Number.parseFloat(weight.replace(/[^\d.]/g, ""));
  const weightValid = Number.isFinite(weightGrams) && weightGrams > 0;

  const input: CalculatorInput = {
    metal: line?.row.metal ?? "gold",
    purity: line?.row.fineness ?? "999",
    weightGrams: weightValid ? weightGrams : 0,
  };

  const result = estimate(input, line?.latest ?? null);
  const enquiry = whatsappHref(
    line
      ? `Hello Tulsi Jewellers, I would like today's price for ${weightsLabel(
          line,
          weightValid ? weightGrams : null,
        )}.`
      : "Hello Tulsi Jewellers, I would like today's price for a piece.",
  );

  if (lines.length === 0) {
    return (
      <div className="space-y-4">
        <Notice tone="placeholder" title={t("calc.noRateTitle")}>
          <p>{t("calc.noRateBody")}</p>
        </Notice>
        <div className="flex flex-wrap gap-3">
          {enquiry ? (
            <a
              href={enquiry}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("common.whatsapp")}
            </a>
          ) : null}
          <a
            href={telHref(CONTACT.primaryPhone)}
            className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t("common.call")} {telDisplay(CONTACT.primaryPhone)}
          </a>
        </div>
      </div>
    );
  }

  const money = (value: number | null) => (value === null ? "—" : `₹ ${formatINR(value)}`);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <form
        className="space-y-4 border border-gold/25 bg-offwhite p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2 text-gold-700">
          <Calculator className="h-5 w-5" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">{t("calc.title")}</h2>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-charcoal">{t("calc.purity")}</span>
          <select
            value={line?.row.id ?? ""}
            onChange={(event) => setLineId(event.target.value)}
            className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2.5 text-sm focus:border-maroon focus:outline-none"
          >
            {lines.map((entry) => (
              <option key={entry.row.id} value={entry.row.id}>
                {entry.row.purityLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-charcoal">{t("calc.weight")}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder={t("calc.weightPlaceholder")}
            className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2.5 text-sm focus:border-maroon focus:outline-none"
          />
          {!weightValid ? <span className="text-xs text-maroon">{t("calc.invalidWeight")}</span> : null}
        </label>

        <button
          type="button"
          onClick={() => setWeight("8")}
          className="text-xs text-charcoal/70 underline underline-offset-4 hover:text-maroon"
        >
          {t("calc.reset")}
        </button>

        <div className="flex flex-wrap gap-3 border-t border-gold/25 pt-4">
          {enquiry ? (
            <a
              href={enquiry}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
          <a
            href={telHref(CONTACT.primaryPhone)}
            className="inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-offwhite px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {telDisplay(CONTACT.primaryPhone)}
          </a>
        </div>
      </form>

      {/* Result */}
      <div className="space-y-4 border border-gold/25 bg-offwhite p-5">
        <dl className="space-y-2 text-sm">
          <Row label={t("calc.estimatedMetalValue")} value={money(result.metalValue)} strong />
        </dl>

        <p className="text-sm leading-relaxed text-charcoal/80">{MAKING_CHARGES_NOTE}</p>

        {result.rateUsed ? (
          <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-charcoal/70">
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              {t("calc.rateUsed")}:
            </span>
            <span className="font-medium text-maroon">
              {formatRate(result.rateUsed.rate, result.rateUsed.unit)}
            </span>
            <span suppressHydrationWarning>
              · {formatDateTime(result.rateUsed.observedAt, lang)} · {result.rateUsed.source}
            </span>
          </p>
        ) : null}

        {/* The stored value is quoted per 10 g (gold) or per kg (silver); the
            per-gram figure is simple division of a published number. */}
        {result.rateUsed ? (
          <p className="text-xs text-charcoal/70">
            {t("calc.perGram")}: ₹ {formatINR(perGram(result.rateUsed))}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-charcoal/70">{t("calc.estimateNote")}</p>
      </div>
    </div>
  );
}

/** "22K gold, 8 g" — built from the selected row, never from a guess. */
function weightsLabel(line: RateLine, grams: number | null): string {
  const weight = grams === null ? "" : `, ${grams} g`;
  return `${line.row.purityLabel}${weight}`;
}

/** ₹ per gram derived from the stored unit (÷10 for gold, ÷1000 for silver). */
function perGram(observation: RateObservation): number {
  return observation.unit === "INR_PER_KG" ? observation.rate / 1000 : observation.rate / 10;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-medium text-charcoal" : "text-charcoal/70"}>{label}</dt>
      <dd className={strong ? "text-base font-medium text-maroon" : "text-charcoal/85"}>{value}</dd>
    </div>
  );
}
