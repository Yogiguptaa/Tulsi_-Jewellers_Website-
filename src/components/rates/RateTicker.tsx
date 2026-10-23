"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, RefreshCw, TrendingUp } from "lucide-react";
import { CONTACT, ROUTES, telDisplay, telHref, whatsappHref } from "@/lib/config";
import { ageLabel, formatINR, formatDateTime } from "@/lib/rates/format";
import type { ApiRateLine, ApiRatesPayload } from "@/lib/rates/api-payload";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useNowMs } from "@/lib/clock";

/** Which rows the compact ticker shows on the home page. */
const TICKER_ROWS = ["gold-999", "gold-916", "silver-999"];

/**
 * Homepage rate strip. Unlike the rates page (server-rendered from the cached
 * snapshot), the ticker asks the API directly every few minutes, so a benchmark
 * recorded in the showroom appears here without a redeploy.
 *
 * It renders nothing but an honest message until a real value exists — the
 * skeleton, the failure state and the "not configured" state all say what is
 * actually happening rather than showing a placeholder number.
 */
export default function RateTicker({ initial = null }: { initial?: ApiRatesPayload | null }) {
  const { lang, t } = useLanguage();
  // Server-rendered first value: the strip paints today's rate with the HTML,
  // then keeps itself current by polling.
  const [data, setData] = useState<ApiRatesPayload | null>(initial);
  const [failed, setFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Shared clock for the "updated 3 hours ago" label. Declared before any early
  // return so the hook order never changes between renders.
  const now = useNowMs();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/rates/latest", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as ApiRatesPayload;
        if (!cancelled) {
          setData(payload);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  if (failed) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-gold/30 bg-champagne/25 px-4 py-3 text-sm text-charcoal/75">
        <span>{t("rates.notConfiguredNote")}</span>
        <Link href={ROUTES.rates} className="font-medium text-maroon underline underline-offset-4">
          {t("rates.viewRates")}
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border-y border-gold/30 bg-champagne/20 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-charcoal/70">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const rows = TICKER_ROWS.map((id) => data.lines.find((line) => line.id === id)).filter(
    (line): line is ApiRateLine => Boolean(line),
  );
  const hasAnyValue = rows.some((line) => line.rate !== null);
  // "updated 3 hours ago" — computed from the shared clock so the server render
  // and the browser never disagree.
  const age = hasAnyValue && now !== null ? ageLabel(data.asOf, now, lang) : null;

  return (
    <div className="border-y border-gold/30 bg-gradient-to-r from-champagne/25 via-ivory to-champagne/25">
      <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {t("rates.tickerLabel")}
        </span>

        {hasAnyValue ? (
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {rows.map((line) => (
              <div key={line.id} className="flex items-baseline gap-2">
                <dt className="text-xs text-charcoal/70">{line.purityLabel}</dt>
                <dd className="flex items-baseline gap-1.5">
                  {line.rate === null ? (
                    <span className="text-sm text-charcoal/70">{t("rates.unavailable")}</span>
                  ) : (
                    <>
                      <span className="font-medium text-maroon">
                        ₹ {formatINR(line.rate)}
                      </span>
                      <span className="text-[11px] text-charcoal/70">
                        {line.unit === "INR_PER_10_GRAM" ? t("rates.unitPer10g") : t("rates.unitPerKg")}
                      </span>
                      <DeltaBadge abs={line.deltaAbs} label={`${line.deltaAbs ?? 0}`} />
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm text-charcoal/75">{t("rates.noData")}</span>
            {whatsappHref(
              "Hello Tulsi Jewellers, please tell me today's gold and silver rate.",
            ) ? (
              <a
                href={
                  whatsappHref(
                    "Hello Tulsi Jewellers, please tell me today's gold and silver rate.",
                  )!
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-maroon underline underline-offset-4"
              >
                {t("common.whatsapp")}
              </a>
            ) : null}
            <a
              href={telHref(CONTACT.primaryPhone)}
              className="text-xs font-medium text-maroon underline underline-offset-4"
            >
              {t("common.call")} {telDisplay(CONTACT.primaryPhone)}
            </a>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Source and freshness are part of the value: a customer must be able
              to see where the number came from and how old it is. */}
          {hasAnyValue ? (
            <span className="text-[11px] text-charcoal/70">
              {t("rates.source")}: {data.providerLabel}
            </span>
          ) : null}
          {data.asOf ? (
            <span className="text-[11px] text-charcoal/70" suppressHydrationWarning>
              {t("rates.asOn")} {formatDateTime(data.asOf, lang)}
              {age ? ` (${age})` : ""}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setData(null);
              setRefreshKey((key) => key + 1);
            }}
            aria-label={t("rates.viewRates")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gold/40 text-maroon hover:bg-champagne/70"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <Link
            href={ROUTES.rates}
            className="text-xs font-medium text-maroon underline underline-offset-4"
          >
            {t("rates.viewRates")}
          </Link>
        </div>
      </div>

      {/* Converted spot prices carry their own mandatory note, printed verbatim. */}
      {hasAnyValue && data.customerNote ? (
        <p className="container-page border-t border-gold/20 py-2 text-[11px] text-charcoal/70">
          {data.customerNote}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Small up / down / flat indicator for the change against the previous value.
 * Renders nothing when there is no previous observation to compare with, so a
 * first-ever rate never pretends to have moved.
 */
export function DeltaBadge({ abs, label }: { abs: number | null; label?: string }) {
  if (abs === null) return null;
  const direction = abs > 0 ? "up" : abs < 0 ? "down" : "flat";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
        ? "text-maroon"
        : "text-charcoal/70";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] ${tone}`} title={label}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {formatINR(Math.abs(abs))}
    </span>
  );
}
