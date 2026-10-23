"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/rates/format";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";

export type HistoryRow = { date: string; values: Record<string, number> };

/** Series key → dictionary key for its display label. */
const LABEL_KEY: Record<string, TranslationKey> = {
  "gold:999:INR_PER_10_GRAM": "rates.seriesGold999",
  "gold:916:INR_PER_10_GRAM": "rates.seriesGold916",
  "gold:833:INR_PER_10_GRAM": "rates.seriesGold833",
  "gold:750:INR_PER_10_GRAM": "rates.seriesGold750",
  "gold:585:INR_PER_10_GRAM": "rates.seriesGold585",
  "silver:999:INR_PER_KG": "rates.seriesSilver999",
};

/** Brand-safe line colours, picked to stay distinguishable in the default view. */
const STROKE = ["#5a0f1b", "#b8923a", "#0f3d2e", "#8a3541", "#9a7a2e", "#1f1b16"];

const WIDTH = 720;
const HEIGHT = 300;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };

/**
 * Chart of recorded daily benchmarks. Deliberately drawn from the stored rows
 * only: no interpolation, no smoothing and no trend line, because a smooth curve
 * would imply data points the showroom never recorded.
 *
 * The same numbers are always available as a table underneath (and to screen
 * readers via the caption), so the information never depends on the graphic.
 */
export default function RateHistoryChart({ rows }: { rows: HistoryRow[] }) {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState<string[]>([]);

  const seriesKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) for (const key of Object.keys(row.values)) keys.add(key);
    return Array.from(keys).filter((key) => key in LABEL_KEY).sort();
  }, [rows]);

  const visible = seriesKeys.filter((key) => !hidden.includes(key));

  const { min, max } = useMemo(() => {
    const values: number[] = [];
    for (const row of rows) {
      for (const key of visible) {
        const value = row.values[key];
        if (typeof value === "number") values.push(value);
      }
    }
    if (values.length === 0) return { min: 0, max: 1 };
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo || hi || 1) * 0.08;
    return { min: lo - pad, max: hi + pad };
  }, [rows, visible]);

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (index: number) =>
    rows.length === 1 ? PAD.left + plotWidth / 2 : PAD.left + (index / (rows.length - 1)) * plotWidth;
  const y = (value: number) =>
    PAD.top + plotHeight - ((value - min) / (max - min || 1)) * plotHeight;

  const toggle = (key: string) =>
    setHidden((current) =>
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key],
    );

  if (rows.length === 0 || seriesKeys.length === 0) {
    return (
      <div className="border border-dashed border-gold/50 bg-offwhite/60 p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-xl">{t("rates.historyEmpty")}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/70">{t("rates.historyEmptyBody")}</p>
      </div>
    );
  }

  const label = (key: string) => t(LABEL_KEY[key]);
  const tickIndexes = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter(
    (value, index, array) => array.indexOf(value) === index,
  );

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-2">
        {seriesKeys.map((key, index) => {
          const off = hidden.includes(key);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={!off}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  off
                    ? "border-charcoal/20 text-charcoal/70"
                    : "border-gold/45 bg-offwhite text-charcoal"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STROKE[index % STROKE.length], opacity: off ? 0.35 : 1 }}
                />
                {label(key)}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="overflow-x-auto border border-gold/25 bg-offwhite p-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          role="img"
          aria-label={t("rates.historyTitle")}
          className="min-w-[38rem]"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = max - fraction * (max - min);
            const yPos = PAD.top + fraction * plotHeight;
            return (
              <g key={fraction}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={yPos}
                  y2={yPos}
                  stroke="rgba(184,146,58,0.28)"
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={yPos + 4} textAnchor="end" fontSize={11} fill="#6b6257">
                  {formatINR(value)}
                </text>
              </g>
            );
          })}

          {tickIndexes.map((index) => (
            <text
              key={`tick-${index}`}
              x={x(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={11}
              fill="#6b6257"
            >
              {rows[index].date}
            </text>
          ))}

          {visible.map((key) => {
            const strokeIndex = seriesKeys.indexOf(key);
            const points = rows
              .map((row, index) => {
                const value = row.values[key];
                return typeof value === "number" ? `${x(index)},${y(value)}` : null;
              })
              .filter((point): point is string => point !== null);
            if (points.length === 0) return null;
            return (
              <g key={key}>
                <polyline
                  fill="none"
                  stroke={STROKE[strokeIndex % STROKE.length]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  points={points.join(" ")}
                />
                {points.map((point) => {
                  const [cx, cy] = point.split(",");
                  return (
                    <circle
                      key={`${key}-${point}`}
                      cx={cx}
                      cy={cy}
                      r={2.5}
                      fill={STROKE[strokeIndex % STROKE.length]}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <details className="border border-gold/25 bg-offwhite">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-maroon">
          {t("rates.historyTitle")} — {t("common.showAll")}
        </summary>
        <div className="overflow-x-auto border-t border-gold/25">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="bg-champagne/20 text-left text-[11px] uppercase tracking-[0.12em] text-charcoal/70">
                <th scope="col" className="px-4 py-2 font-semibold">
                  {t("rates.date")}
                </th>
                {visible.map((key) => (
                  <th key={key} scope="col" className="px-4 py-2 font-semibold">
                    {label(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/20">
              {rows
                .slice()
                .reverse()
                .map((row) => (
                  <tr key={row.date}>
                    <th scope="row" className="px-4 py-2 text-left font-normal text-charcoal/80">
                      {row.date}
                    </th>
                    {visible.map((key) => (
                      <td key={key} className="px-4 py-2 text-charcoal/80">
                        {typeof row.values[key] === "number" ? formatINR(row.values[key]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
