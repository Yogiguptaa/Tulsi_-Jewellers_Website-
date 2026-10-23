"use client";

import {
  AlertTriangle,
  Clock,
  Database,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import {
  CONTACT,
  MAKING_CHARGES_NOTE,
  RATE_ATTRIBUTION,
  RATE_DISCLAIMER,
  telDisplay,
  telHref,
  whatsappHref,
} from "@/lib/config";
import {
  STATUS_LABEL,
  ageLabel,
  formatDateTime,
  formatDelta,
  formatINR,
  formatRate,
  sessionLabel,
} from "@/lib/rates/format";
import type { RatesSnapshot } from "@/lib/rates/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useNowMs } from "@/lib/clock";
import Notice from "@/components/ui/Notice";

/**
 * The rates table. Every cell is derived from a stored observation — a missing
 * value shows the explicit "unavailable" message, never ₹0 and never a dash that
 * could be mistaken for a price. Source, date, time and market session are always
 * visible next to the number, together with what it excludes: making charges,
 * which vary by design and are settled at the counter.
 *
 * Layout: on phones each rate is a stacked block, so nothing is cut off or needs
 * sideways scrolling; from `sm` up the same data is a table. Both branches are
 * rendered from one set of derived rows, so they cannot drift apart.
 */
export default function RateBoard({ snapshot }: { snapshot: RatesSnapshot }) {
  const { lang, t } = useLanguage();
  // A converted international spot price is never called a published benchmark.
  const status =
    snapshot.spotConverted && snapshot.status === "updated"
      ? { en: "Latest available rate", hi: "नवीनतम उपलब्ध भाव", tone: "text-emerald-600" }
      : STATUS_LABEL[snapshot.status];

  // Relative age is computed on the client only: the server render time and the
  // browser time differ, and a hydration mismatch here would be visible. The
  // shared clock keeps it fresh without setState-in-effect.
  const now = useNowMs();

  const age = now === null ? null : ageLabel(snapshot.asOf, now, lang);

  // Share text is built ONLY from values that are really on the board, and carries
  // the source, the time and the standing caveat with it. Nothing is shared while
  // no verified rate exists.
  const shareable = snapshot.status !== "unavailable" && snapshot.asOf !== null;
  const shareLines = snapshot.lines
    .filter((line) => line.latest && line.latest.rate > 0)
    .slice(0, 4)
    .map(
      (line) =>
        `${line.row.purityLabel}: ₹ ${formatINR(line.latest!.rate)} ${
          line.row.unit === "INR_PER_KG" ? "per kg" : "per 10 g"
        }`,
    );
  const shareText = shareable
    ? [
        "Tulsi Jewellers — today's rate",
        ...shareLines,
        `Source: ${snapshot.providerLabel}`,
        `As on ${formatDateTime(snapshot.asOf, lang)}`,
        snapshot.customerNote ?? "Indicative bullion rate; confirm today's rate at the store.",
      ].join("\n")
    : null;

  // A feed that does not publish an AM/PM session should not repeat "session not
  // stated" six times; the column only exists when there is something in it.
  const hasSession = snapshot.lines.some(
    (line) => line.latest?.session === "AM" || line.latest?.session === "PM",
  );

  const rows = snapshot.lines.map((line) => ({
    id: line.row.id,
    purityLabel: line.row.purityLabel,
    unitLabel:
      line.row.unit === "INR_PER_10_GRAM" ? t("rates.unitPer10g") : t("rates.unitPerKg"),
    value: formatRate(line.latest?.rate ?? null, line.row.unit),
    source: line.latest?.source ?? null,
    delta: formatDelta(line.deltaAbs, line.deltaPct),
    deltaTone:
      (line.deltaAbs ?? 0) > 0
        ? "text-emerald-600"
        : (line.deltaAbs ?? 0) < 0
          ? "text-maroon"
          : "text-charcoal/70",
    session: line.latest ? sessionLabel(line.latest.session, lang) : "—",
    observedAt: line.latest ? formatDateTime(line.latest.observedAt, lang) : "—",
  }));

  // Nothing recorded (or nothing readable): say so in one plain sentence and
  // give the customer the two ways to get today's number. No empty table, no
  // ₹0, no provider or configuration detail.
  if (snapshot.status === "unavailable") {
    return (
      <div className="space-y-5">
        <div className="border border-gold/30 bg-offwhite p-6 sm:p-8">
          <p className="font-[family-name:var(--font-display)] text-xl text-maroon">
            {t("calc.noRateTitle")}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/80">
            {t("rates.noData")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {whatsappHref("Hello Tulsi Jewellers, please tell me today's gold and silver rate.") ? (
              <a
                href={whatsappHref(
                  "Hello Tulsi Jewellers, please tell me today's gold and silver rate.",
                )!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-maroon px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("common.whatsapp")}
              </a>
            ) : null}
            <a
              href={telHref(CONTACT.primaryPhone)}
              className="inline-flex items-center gap-2 rounded-sm border border-gold/50 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t("common.call")} {telDisplay(CONTACT.primaryPhone)}
            </a>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-charcoal/70">{RATE_DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-gold/40 bg-offwhite px-3 py-1.5 text-xs font-medium ${status.tone}`}
        >
          {snapshot.status === "stale" ? (
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {lang === "hi" ? status.hi : status.en}
        </span>

        {/* Only shown once there is a timestamp to show: with no rate recorded,
            this line just repeated the status badge word for word. */}
        {snapshot.asOf ? (
          <span className="inline-flex items-center gap-2 text-xs text-charcoal/70">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span suppressHydrationWarning>
              {`${t("rates.asOn")} ${formatDateTime(snapshot.asOf, lang)}${age ? ` (${age})` : ""}`}
            </span>
          </span>
        ) : null}

        {/* "Source: <name>, published <time>" — a value is only ever attributed
            to the source it actually came from, and its own publish time is
            printed next to it. */}
        <span className="text-xs text-charcoal/70">
          {t("rates.source")}: {snapshot.providerLabel}
          {snapshot.asOf ? (
            <span suppressHydrationWarning> · {formatDateTime(snapshot.asOf, lang)}</span>
          ) : null}
        </span>
      </div>

      {/* When the board carries values from more than one source, each source is
          named with its own newest time. Nothing is averaged or blended across
          providers — a value belongs to exactly one source. */}
      {snapshot.sources.length > 1 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal/70">
          <li className="font-medium text-charcoal/80">{t("rates.sources")}:</li>
          {snapshot.sources.map((source) => (
            <li key={source.name} suppressHydrationWarning>
              {source.name}
              {source.observedAt ? ` — ${formatDateTime(source.observedAt, lang)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Share row — only when there is a verified value to share. The image
          route returns 404 with nothing recorded, so the link can never produce
          a card with a blank or zero rate. */}
      {shareable && shareText ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={whatsappHref(shareText) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {t("rates.shareText")}
          </a>
          <a
            href="/rates/share"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-gold/50 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-champagne/60"
          >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            {t("rates.shareImage")}
          </a>
        </div>
      ) : null}

      {/* Older than the staleness window: the last verified number stays on the
          board with its date, and the notice says to confirm it today. */}
      {snapshot.notice ? <Notice tone="warning">{snapshot.notice}</Notice> : null}

      {/* Mandatory wording for converted spot prices. Printed verbatim, right
          under the numbers it describes. */}
      {snapshot.customerNote ? (
        <Notice tone="info">
          <p>{snapshot.customerNote}</p>
        </Notice>
      ) : null}

      {/* Phones: one block per purity, so no cell is cut off and the table never
          scrolls sideways. */}
      <ul className="divide-y divide-gold/20 border border-gold/25 bg-offwhite sm:hidden">
        {rows.map((row) => (
          <li key={row.id} className="space-y-2 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-charcoal">
                {row.purityLabel}
                <span className="ml-2 text-[11px] font-normal text-charcoal/70">
                  {row.unitLabel}
                </span>
              </p>
              {row.value ? (
                <p className="font-medium text-maroon">{row.value}</p>
              ) : (
                <p className="text-sm text-charcoal/70">{t("rates.unavailable")}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-charcoal/70">
              {row.delta ? (
                <div className="flex gap-1">
                  <dt>{t("rates.change")}:</dt>
                  <dd className={row.deltaTone}>{row.delta}</dd>
                </div>
              ) : null}
              {hasSession ? (
                <div className="flex gap-1">
                  <dt>{t("rates.session")}:</dt>
                  <dd>{row.session}</dd>
                </div>
              ) : null}
              <div className="flex gap-1">
                <dt>{t("rates.asOn")}:</dt>
                <dd suppressHydrationWarning>{row.observedAt}</dd>
              </div>
              <div className="col-span-2 flex gap-1">
                <dt>{t("rates.source")}:</dt>
                <dd>
                  {row.source ?? t("rates.sourceUnavailable")}
                  {row.source && row.observedAt !== "—" ? ` — ${row.observedAt}` : ""}
                </dd>
              </div>
              <div className="col-span-2 text-[11px] leading-relaxed text-charcoal/70">
                {MAKING_CHARGES_NOTE}
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* From sm up the same rows are a table. Kept focusable because a narrow
          viewport can still make it scroll, and a scroll region that only reacts
          to the mouse is unreachable by keyboard (WCAG 2.1.1). */}
      <div
        role="region"
        aria-label={t("rates.title")}
        tabIndex={0}
        className="hidden overflow-x-auto border border-gold/25 bg-offwhite sm:block"
      >
        <table className={`w-full ${hasSession ? "min-w-[46rem]" : "min-w-[40rem]"} border-collapse text-sm`}>
          <caption className="sr-only">{t("rates.title")}</caption>
          <thead>
            <tr className="border-b border-gold/25 bg-champagne/25 text-left text-[11px] uppercase tracking-[0.12em] text-charcoal/70">
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("catalogue.purity")}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("common.price")}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("rates.change")}
              </th>
              {hasSession ? (
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t("rates.session")}
                </th>
              ) : null}
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("rates.source")}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("rates.asOn")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/20">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <th scope="row" className="px-4 py-3 text-left font-medium text-charcoal">
                  {row.purityLabel}
                  <span className="block text-[11px] font-normal text-charcoal/70">
                    {row.unitLabel}
                  </span>
                </th>
                <td className="px-4 py-3">
                  {row.value ? (
                    <span className="font-medium text-maroon">{row.value}</span>
                  ) : (
                    <span className="text-charcoal/70">{t("rates.unavailable")}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.delta ? (
                    <span className={row.deltaTone}>{row.delta}</span>
                  ) : (
                    <span className="text-charcoal/70">—</span>
                  )}
                </td>
                {hasSession ? (
                  <td className="px-4 py-3 text-charcoal/75">{row.session}</td>
                ) : null}
                <td className="px-4 py-3 text-xs text-charcoal/70">
                  {row.source ?? t("rates.sourceUnavailable")}
                </td>
                <td className="px-4 py-3 text-charcoal/70" suppressHydrationWarning>
                  {row.observedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-charcoal/75">{MAKING_CHARGES_NOTE}</p>

      <Notice tone="info" title={t("rates.disclaimerTitle")}>
        <p>{RATE_DISCLAIMER}</p>
      </Notice>

      {/* Attribution required by the free spot feed whenever its values are shown. */}
      {snapshot.spotConverted ? (
        <p className="text-[11px] text-charcoal/60">
          {t("rates.spotSource")}{" "}
          <a
            href={RATE_ATTRIBUTION.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-maroon"
          >
            {RATE_ATTRIBUTION.label}
          </a>
        </p>
      ) : null}

    </div>
  );
}
