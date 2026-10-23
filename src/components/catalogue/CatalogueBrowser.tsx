"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { GEMSTONES, pick } from "@/lib/config";
import {
  availableFacets,
  filterProducts,
  sortProducts,
} from "@/lib/catalogue/select";
import { JEWEL_TYPES } from "@/lib/catalogue/jewel-types";
import type { CatalogueFilters, JewelTypeSlug, Product, SortKey } from "@/lib/catalogue/types";
import { SORT_OPTIONS } from "@/lib/catalogue/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import ProductCard from "./ProductCard";
import EmptyCatalogue from "./EmptyCatalogue";

type Props = {
  /** Products already scoped by the page (collection, jewellery type, …). */
  products: Product[];
  /** Search text arriving from the header search drawer (?q=). */
  initialQuery?: string;
  /** Type chips are hidden on a type page — they would be redundant. */
  showTypeChips?: boolean;
  /** Copy shown above the grid. */
  heading?: string;
};

const METAL_LABELS: Record<string, { en: string; hi: string }> = {
  gold: { en: "Gold", hi: "सोना" },
  silver: { en: "Silver", hi: "चांदी" },
  gemstone: { en: "Gemstone", hi: "रत्न" },
  fashion: { en: "Fashion", hi: "फैशन" },
};

const OCCASION_LABELS: Record<string, { en: string; hi: string }> = {
  bridal: { en: "Bridal", hi: "ब्राइडल" },
  daily: { en: "Everyday", hi: "रोज़ाना" },
  festive: { en: "Festive", hi: "त्योहार" },
  gifting: { en: "Gifting", hi: "उपहार" },
};

const GENDER_LABELS: Record<string, { en: string; hi: string }> = {
  women: { en: "Women", hi: "महिला" },
  men: { en: "Men", hi: "पुरुष" },
  kids: { en: "Kids", hi: "बच्चे" },
  unisex: { en: "Unisex", hi: "सभी के लिए" },
};

export default function CatalogueBrowser({
  products,
  initialQuery = "",
  showTypeChips = true,
  heading,
}: Props) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<CatalogueFilters>({});
  const [sort, setSort] = useState<SortKey>("featured");
  const [panelOpen, setPanelOpen] = useState(false);

  const facets = useMemo(() => availableFacets(products), [products]);

  const visible = useMemo(
    () => sortProducts(filterProducts(products, { ...filters, query }), sort, lang),
    [products, filters, query, sort, lang],
  );

  const activeCount =
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").length +
    (query.trim() ? 1 : 0);

  const set = (key: keyof CatalogueFilters, value: string | undefined) =>
    setFilters((current) => ({ ...current, [key]: value === "" ? undefined : value }));

  const clearAll = () => {
    setFilters({});
    setQuery("");
    setSort("featured");
  };

  const label = (entry: { en: string; hi: string } | undefined, fallback: string) =>
    entry ? pick(entry, lang) : fallback;

  // Nothing to browse yet: one plain invitation, no search box, no filters and
  // no "0 items" line. The catalogue appears as the owner publishes pieces.
  if (products.length === 0) {
    return <EmptyCatalogue />;
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-gold/30 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative flex w-full items-center lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-charcoal/70" aria-hidden="true" />
          <span className="sr-only">{t("catalogue.searchLabel")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("catalogue.searchPlaceholder")}
            className="w-full rounded-sm border border-gold/40 bg-offwhite py-2.5 pl-9 pr-9 text-sm text-charcoal placeholder:text-charcoal/45 focus:border-maroon focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("catalogue.clearSearch")}
              className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-charcoal/70 hover:bg-champagne/70"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            className="inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-offwhite px-3 py-2 text-sm text-charcoal hover:bg-champagne/60"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t("catalogue.filters")}
            {activeCount > 0 ? (
              <span className="rounded-full bg-maroon px-1.5 text-[11px] text-offwhite">{activeCount}</span>
            ) : null}
          </button>

          <label className="inline-flex items-center gap-2 text-sm text-charcoal/80">
            {/* sr-only on small screens, visible from sm up: a display:none label
                would leave the select with no accessible name on mobile. */}
            <span className="sr-only sm:not-sr-only">{t("catalogue.sortBy")}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-sm border border-gold/40 bg-offwhite px-2 py-2 text-sm text-charcoal focus:border-maroon focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {pick(option.label, lang)}
                </option>
              ))}
            </select>
          </label>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-maroon underline underline-offset-4 hover:text-maroon-300"
            >
              {t("catalogue.clearAll")}
            </button>
          ) : null}
        </div>
      </div>

      {/* Filter panel.
          Phones: a bottom sheet over a dimmed backdrop, with a handle to drag and
          a results button to dismiss — thumbs reach the bottom of the screen, not
          a toolbar at the top. From `lg` up the same panel is the inline grid it
          has always been, so no behaviour is lost on a desktop. */}
      {panelOpen ? (
        <>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-charcoal/45 lg:hidden"
          />
          <div
            role="group"
            aria-label={t("catalogue.filters")}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-gold/40 bg-offwhite p-4 pb-6 shadow-lift lg:static lg:z-auto lg:max-h-none lg:rounded-sm lg:border lg:bg-offwhite/70 lg:pb-4 lg:shadow-none"
          >
            <div className="mb-3 flex items-center justify-center lg:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-gold/50" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterGroup label={t("catalogue.filterMetal")}>
            <Chip active={!filters.metal} onClick={() => set("metal", undefined)}>
              {t("catalogue.any")}
            </Chip>
            {facets.metals.map((metal) => (
              <Chip key={metal} active={filters.metal === metal} onClick={() => set("metal", metal)}>
                {label(METAL_LABELS[metal], metal)}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label={t("catalogue.filterPurity")}>
            <Chip active={!filters.purity} onClick={() => set("purity", undefined)}>
              {t("catalogue.any")}
            </Chip>
            {facets.purities.map((purity) => (
              <Chip
                key={purity}
                active={filters.purity === purity}
                onClick={() => set("purity", purity as CatalogueFilters["purity"])}
              >
                {purity}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label={t("catalogue.filterFor")}>
            <Chip active={!filters.gender} onClick={() => set("gender", undefined)}>
              {t("catalogue.any")}
            </Chip>
            {facets.genders.map((gender) => (
              <Chip
                key={gender}
                active={filters.gender === gender}
                onClick={() => set("gender", gender as CatalogueFilters["gender"])}
              >
                {label(GENDER_LABELS[gender], gender)}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label={t("catalogue.filterOccasion")}>
            <Chip active={!filters.occasion} onClick={() => set("occasion", undefined)}>
              {t("catalogue.any")}
            </Chip>
            {facets.occasions.map((occasion) => (
              <Chip
                key={occasion}
                active={filters.occasion === occasion}
                onClick={() => set("occasion", occasion as CatalogueFilters["occasion"])}
              >
                {label(OCCASION_LABELS[occasion], occasion)}
              </Chip>
            ))}
          </FilterGroup>

          {facets.gemstones.length > 0 ? (
            <FilterGroup label={t("catalogue.filterStone")}>
              <Chip active={!filters.gemstone} onClick={() => set("gemstone", undefined)}>
                {t("catalogue.any")}
              </Chip>
              {facets.gemstones.map((gemstone) => {
                const meta = GEMSTONES.find((entry) => entry.slug === gemstone);
                return (
                  <Chip
                    key={gemstone}
                    active={filters.gemstone === gemstone}
                    onClick={() => set("gemstone", gemstone)}
                  >
                    {meta ? pick(meta.name, lang) : gemstone}
                  </Chip>
                );
              })}
            </FilterGroup>
          ) : null}
            </div>

            {/* Only on phones: the sheet stays open while the visitor picks
                several filters, then closes with the count of what they chose. */}
            <div className="mt-5 flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-maroon underline underline-offset-4"
              >
                {t("catalogue.clearAll")}
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite hover:bg-maroon-700"
              >
                {t("catalogue.showResults", { count: visible.length })}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Type chips */}
      {showTypeChips ? (
        <nav aria-label={t("catalogue.browseByType")} className="flex flex-wrap gap-2">
          {JEWEL_TYPES.map((type) => (
            <Link
              key={type.slug}
              href={`/jewellery/${type.slug}`}
              className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-charcoal/80 hover:border-maroon hover:text-maroon"
            >
              {pick(type.chip, lang)}
            </Link>
          ))}
        </nav>
      ) : null}

      {/* Result count — an h2 on purpose: the cards below are h3, so without a
          section heading here the outline jumps straight from h1 to h3. */}
      <h2 className="text-sm font-normal text-charcoal/70">
        {visible.length} {visible.length === 1 ? t("catalogue.itemSingular") : t("catalogue.itemPlural")}
        {heading ? ` · ${heading}` : ""}
      </h2>

      {visible.length === 0 ? (
        <div className="rounded-sm border border-dashed border-gold/50 bg-offwhite/60 p-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-charcoal">
            {t("catalogue.noResultsTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/70">{t("catalogue.noResultsBody")}</p>
          <div className="mt-4">
            <EmptyCatalogue plain />
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2 text-sm text-offwhite hover:bg-maroon-700"
          >
            {t("catalogue.clearAll")}
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <li key={product.code} className="h-full">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-maroon bg-maroon text-offwhite"
          : "border-gold/40 bg-offwhite text-charcoal/80 hover:border-maroon hover:text-maroon"
      }`}
    >
      {children}
    </button>
  );
}

export type { JewelTypeSlug };
