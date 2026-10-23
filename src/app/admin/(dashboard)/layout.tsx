import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import AdminIdentity from "@/components/admin/AdminIdentity";

/**
 * The admin shell: brand bar, sidebar, content.
 *
 * Deliberately does NOT check the session itself. The docs' advice for this Next
 * version is to fetch the user where it is displayed and do the authorization
 * check in the Data Access Layer, so each page calls `requireAdmin()` and the
 * identity strip re-reads the gate on its own. That keeps one source of truth and
 * means an access change takes effect on the very next request.
 *
 * `noindex` is set here so no admin screen can ever be crawled, even by hand.
 */
export const metadata: Metadata = {
  title: "Admin — Tulsi Jewellers",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-gold/40 bg-maroon text-offwhite">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg">Tulsi Jewellers · Admin</p>
            <p className="text-xs text-champagne/70">Internal tool — not visible to visitors</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-champagne/80 underline-offset-2 hover:underline">
              Public site
            </Link>
            <Suspense fallback={<span className="text-xs text-champagne/60">…</span>}>
              <AdminIdentity />
            </Suspense>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* AdminNav reads `usePathname()`, a client hook: with Cache Components it
            must stream inside a boundary or it would block the whole route. */}
        <Suspense fallback={<span className="text-sm text-charcoal/70">Menu…</span>}>
          <AdminNav />
        </Suspense>
        {/* `main-content` matches the skip link in the root layout: one id for
            the whole app, so "Skip to main content" lands on the admin panel too. */}
        <main id="main-content" className="min-w-0 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
