"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { SCHEME } from "@/lib/config";
import { formatINR } from "@/lib/rates/format";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Notice from "@/components/ui/Notice";

/**
 * Gold Saving Scheme — instalment arithmetic only.
 *
 * It multiplies the monthly amount by the number of instalments and shows the
 * total the customer would pay in. It deliberately does NOT show a bonus, a
 * benefit, a discount or a maturity value: those terms belong to the showroom's
 * scheme card, and inventing a number here would be a promise nobody made. The
 * benefit line points at the store instead.
 *
 * Nothing typed here leaves the browser — there is no submit button and no call.
 */
export default function SchemeCalculator() {
  const { t } = useLanguage();
  const [monthly, setMonthly] = useState(String(SCHEME.startingAmountINR));
  const [months, setMonths] = useState("");

  const amount = Number.parseFloat(monthly.replace(/[^\d.]/g, ""));
  const count = Number.parseInt(months.replace(/\D/g, ""), 10);
  const valid =
    Number.isFinite(amount) && amount > 0 && Number.isFinite(count) && count > 0 && count <= 240;
  const total = valid ? amount * count : null;

  return (
    <div className="space-y-4 border border-gold/25 bg-offwhite p-5">
      <h2 className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-xl text-maroon">
        <Calculator className="h-4 w-4 text-gold-600" aria-hidden="true" />
        {t("scheme.calcTitle")}
      </h2>
      <p className="text-sm text-charcoal/70">{t("scheme.calcBody")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-charcoal">{t("scheme.calcMonthly")}</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
            className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2.5 text-sm focus:border-maroon focus:outline-none"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-charcoal">{t("scheme.calcMonths")}</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={months}
            onChange={(event) => setMonths(event.target.value)}
            placeholder="12"
            className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2.5 text-sm focus:border-maroon focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-baseline justify-between gap-4 border-t border-gold/30 pt-4">
        <span className="text-sm font-medium text-charcoal">{t("scheme.calcTotal")}</span>
        <span className="text-lg font-medium text-maroon">
          {total === null ? "—" : `₹ ${formatINR(total)}`}
        </span>
      </div>

      <Notice tone="info">
        <p>{t("scheme.calcBenefitNote")}</p>
      </Notice>
    </div>
  );
}
