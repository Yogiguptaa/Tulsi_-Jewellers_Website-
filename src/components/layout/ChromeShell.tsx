"use client";

/**
 * A reduced site frame for client-side boundaries (the error pages).
 *
 * `error.tsx` must be a Client Component, so it cannot await the cached
 * announcement or the copyright year. This shell therefore renders only the parts
 * that need no server data — the announcement bar (which falls back to brand copy),
 * the header, and the mobile navigation — and skips the footer rather than
 * hard-coding a year that could be wrong.
 *
 * No `usePathname()` here on purpose: a client hook in the shell blocks
 * prerendering, and a 404/error page should always be available.
 */

import type { ReactNode } from "react";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import MobileBottomBar from "./MobileBottomBar";
import WhatsAppFab from "./WhatsAppFab";

export default function ChromeShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="min-h-[60vh] pb-24 lg:pb-0">
        {children}
      </main>
      <MobileBottomBar />
      <WhatsAppFab />
    </>
  );
}
