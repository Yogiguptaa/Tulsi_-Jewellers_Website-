/**
 * components/layout/SiteFrame.tsx — the public site's chrome.
 *
 * A Server Component, used by the `(site)` route-group layout and by the 404 page.
 * It deliberately contains no client hooks: the earlier version of this file used
 * `usePathname()` to hide the chrome on `/admin`, which forced the whole app into
 * a blocking prerender. Now the route groups decide which chrome a route gets,
 * and this component only assembles the pieces.
 *
 * The copyright year is read with `"use cache"`, so the frame itself can still be
 * prerendered.
 */

import type { ReactNode } from "react";
import { getCopyrightYear } from "@/lib/year";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomBar from "./MobileBottomBar";
import WhatsAppFab from "./WhatsAppFab";
import CommandPalette from "@/components/search/CommandPalette";
import CinematicIntro from "@/components/intro/CinematicIntro";
import ScrollProgress from "./ScrollProgress";

export default async function SiteFrame({ children }: { children: ReactNode }) {
  const year = await getCopyrightYear();

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main-content" className="min-h-[60vh] pb-24 lg:pb-0">
        {children}
      </main>
      <Footer year={year} />
      <MobileBottomBar />
      <WhatsAppFab />
      {/* ⌘K / Ctrl+K (or "/") quick search. Client-only and mounted once, so it
          adds no data fetching to any page. */}
      <CommandPalette />
      {/* Plays once per browser, always skippable, respects reduced motion. */}
      <CinematicIntro />
    </>
  );
}
