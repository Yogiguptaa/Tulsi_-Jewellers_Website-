"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Gem,
  LayoutGrid,
  Package,
  Search,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useStoredValue } from "@/lib/storage";

/**
 * Command palette (⌘K / Ctrl+K, or "/").
 *
 * The index is fetched from /api/search-index on first open — it carries labels
 * and hrefs only, so nothing here can show a stale price. Recent searches are the
 * visitor's own words, kept in localStorage (never sent anywhere), which is what
 * the privacy policy describes.
 *
 * Keyboard: ↑/↓ move, Enter opens, Escape closes. Focus is moved into the dialog
 * and returned to whatever had it, so the palette is usable without a mouse.
 */

type SearchEntry = {
  kind: "page" | "collection" | "type" | "guide" | "product";
  label: string;
  labelHi: string;
  href: string;
  keywords: string[];
};

const RECENT_KEY = "tulsi_recent_searches";
const MAX_RECENT = 5;
const MAX_RESULTS = 8;

const KIND_ICON = {
  page: LayoutGrid,
  collection: Gem,
  type: Gem,
  guide: BookOpen,
  product: Package,
} as const;

/** Parse the stored list defensively: a corrupt value is simply no history. */
function parseRecent(raw: string | null): string[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export default function CommandPalette() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<Element | null>(null);

  // Recent searches re-render reactively when the visitor searches. They are the
  // visitor's own words and never leave the browser.
  const [recent, setRecent] = useStoredValue<string[]>(
    RECENT_KEY,
    [],
    parseRecent,
    (value) => JSON.stringify(value),
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
  }, []);

  // Global shortcuts. Ignored while the visitor is typing in a field so "/" still
  // works as a normal character inside a search box or a form.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openerRef.current = document.activeElement;
        setOpen((current) => !current);
        return;
      }
      if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        openerRef.current = document.activeElement;
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Load the index once, the first time the palette is opened.
  useEffect(() => {
    if (!open || entries.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/search-index", { cache: "force-cache" });
        if (!response.ok) return;
        const payload = (await response.json()) as { entries?: SearchEntry[] };
        if (!cancelled) setEntries(payload.entries ?? []);
      } catch {
        /* offline: the palette simply shows no results */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, entries.length]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") return entries.slice(0, MAX_RESULTS);
    const words = needle.split(/\s+/);
    return entries
      .map((entry) => {
        const haystack = [entry.label, entry.labelHi, ...entry.keywords].join(" ").toLowerCase();
        const score = words.every((word) => haystack.includes(word))
          ? entry.label.toLowerCase().startsWith(words[0])
            ? 2
            : 1
          : 0;
        return { entry, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((row) => row.entry);
  }, [entries, query]);

  const go = useCallback(
    (href: string, term: string) => {
      if (term.trim()) {
        const word = term.trim();
        setRecent([word, ...recent.filter((item) => item !== word)].slice(0, MAX_RECENT));
      }
      close();
      router.push(href);
    },
    [close, recent, router, setRecent],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-charcoal/50 p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t("search.paletteTitle")}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-sm border border-gold/40 bg-offwhite shadow-lift"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          }
          if (event.key === "Enter" && results[active]) {
            event.preventDefault();
            go(results[active].href, query);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-gold/30 px-4 py-3">
          <Search className="h-4 w-4 text-charcoal/60" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={t("search.paletteTitle")}
            aria-label={t("search.paletteTitle")}
            aria-controls="command-palette-results"
            className="w-full bg-transparent text-sm text-charcoal placeholder:text-charcoal/45 focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            aria-label={t("common.close")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-charcoal/60 hover:bg-champagne/70"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="px-4 pt-3 text-[11px] text-charcoal/60">{t("search.paletteHint")}</p>

        <ul id="command-palette-results" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-charcoal/70">{t("search.noResults")}</li>
          ) : (
            results.map((entry, index) => {
              const Icon = KIND_ICON[entry.kind];
              return (
                <li key={`${entry.kind}-${entry.href}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(entry.href, query)}
                    className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm ${
                      index === active ? "bg-champagne/60 text-maroon" : "text-charcoal hover:bg-champagne/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
                    <span className="flex-1">{lang === "hi" ? entry.labelHi : entry.label}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-charcoal/50">
                      {entry.kind}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {query === "" && recent.length > 0 ? (
          <div className="border-t border-gold/25 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-charcoal/60">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {t("search.recent")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-gold/40 px-2.5 py-1 text-xs text-charcoal/80 hover:border-maroon hover:text-maroon"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
