import Skeleton from "@/components/ui/Skeleton";
import { SITE } from "@/lib/config";

/**
 * Loading screen for the public routes.
 *
 * It is deliberately branded — the mark and the showroom's name in both scripts —
 * rather than a bare spinner, and it shows the shape of what is coming (a hero
 * line and a card grid) so the page does not jump when the real content arrives.
 *
 * No business data, no rate and no price is ever rendered here: a placeholder
 * must never be mistaken for a value.
 */
export default function SiteLoading() {
  return (
    <div className="container-page space-y-10 py-16" aria-busy="true" aria-live="polite">
      {/* No "Loading…" label: the skeleton is the indicator, and `aria-busy` tells
          assistive technology the page is still arriving. A visible (or hidden)
          word here would still be text on the page. */}

      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG mark, same asset the header uses */}
        <img src={SITE.logoSrc} alt="" width={44} height={44} className="h-11 w-11 animate-pulse" />
        <span className="flex flex-col leading-tight">
          <span className="font-[family-name:var(--font-display)] text-xl text-maroon">
            {SITE.name.hi}
          </span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-gold-700">
            {SITE.name.en}
          </span>
        </span>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <li key={index} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
