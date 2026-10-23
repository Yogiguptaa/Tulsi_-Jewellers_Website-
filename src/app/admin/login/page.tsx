import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdminGate } from "@/lib/admin/auth";
import { signOutAction } from "@/lib/admin/actions";
import { SubmitButton } from "@/components/admin/AdminForms";
import LoginForm from "@/components/admin/LoginForm";

/**
 * /admin/login — sign in, or find out exactly what is missing.
 *
 * This page is also the setup screen: before a Supabase project exists it lists
 * the three things an owner has to do, instead of a form that cannot possibly
 * work. It never hints at whether a given email exists.
 */
export const metadata: Metadata = {
  title: "Sign in — Tulsi Jewellers Admin",
  // A short, explicit description: without one this screen inherits the store's
  // customer-facing description, which is written for search results and runs
  // past the length a result can show.
  description: "Internal sign-in for the Tulsi Jewellers admin panel.",
  alternates: { canonical: "/admin/login" },
  robots: { index: false, follow: false },
};

/** Only ever send the user to somewhere inside /admin (no open redirect). */
function safeNext(raw: string | undefined): string {
  if (!raw) return "/admin";
  return raw === "/admin" || raw.startsWith("/admin/") ? raw : "/admin";
}

async function LoginScreen({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);
  const gate = await getAdminGate();

  if (gate.status === "ok") redirect(next);
  if (gate.status === "forbidden") {
    return (
      <div className="space-y-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Access not granted</h1>
        <p className="text-sm text-charcoal/75">
          You are signed in as <strong>{gate.email}</strong>, but that account is not on the
          administrator list, so the panel stays closed — including for the data behind it.
        </p>
        <p className="text-sm text-charcoal/75">
          The owner adds administrators in Supabase: table <code>admin_users</code>, one row with
          your user id, your email and role <code>owner</code> or <code>staff</code>.
        </p>
        <form action={signOutAction}>
          <SubmitButton variant="ghost">Sign out</SubmitButton>
        </form>
      </div>
    );
  }

  // ---- Supabase not configured yet: show the setup steps, not a broken form ----
  if (gate.status === "unconfigured") {
    return (
      <div className="space-y-5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Admin setup</h1>
        <p className="text-sm text-charcoal/75">
          The panel is built and waiting, but it has no database to talk to yet. Three steps and
          this page becomes a login screen:
        </p>
        <ol className="space-y-4 text-sm">
          <li className="rounded-sm border border-gold/40 bg-ivory p-4">
            <p className="font-medium">1. Create the Supabase project and add its keys</p>
            <p className="mt-1 text-charcoal/70">
              Copy <code>.env.example</code> to <code>.env.local</code> and fill in{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> (Vercel → Project Settings → Environment
              Variables in production). Restart the dev server afterwards.
            </p>
          </li>
          <li className="rounded-sm border border-gold/40 bg-ivory p-4">
            <p className="font-medium">2. Run the schema, seed and migrations</p>
            <p className="mt-1 text-charcoal/70">
              In the Supabase SQL editor run, in order: <code>supabase/schema.sql</code>,{" "}
              <code>supabase/seed.sql</code>,{" "}
              <code>supabase/migrations/2026-10-10_stage-2.1_catalogue_and_rate_detail.sql</code> and{" "}
              <code>supabase/migrations/2026-10-11_stage-8_admin_audit_log.sql</code>. Each file is
              safe to run again.
            </p>
          </li>
          <li className="rounded-sm border border-gold/40 bg-ivory p-4">
            <p className="font-medium">3. Create your login and promote it</p>
            <p className="mt-1 text-charcoal/70">
              Add a user in Supabase → Authentication → Users, then run the commented{" "}
              <code>insert into public.admin_users</code> statement at the end of{" "}
              <code>supabase/seed.sql</code> with that user&apos;s id and email.
            </p>
          </li>
        </ol>
        <p className="text-sm text-charcoal/70">
          Full walkthrough: <code>docs/OWNER_CHECKLIST.md</code> and{" "}
          <code>supabase/RLS_TESTING.md</code>.
        </p>
      </div>
    );
  }

  // ---- Signed out: the actual login form ----
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Admin sign in</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          For the showroom&apos;s own accounts only. Visitors do not need an account anywhere on
          this site.
        </p>
      </div>
      <LoginForm next={next} />
      <p className="text-xs text-charcoal/70">
        Access is checked twice: here, and again on the server for every screen and every save. A
        bookmarked admin URL cannot bypass it.
      </p>
    </div>
  );
}

/**
 * `searchParams` is passed down and awaited inside the Suspense boundary: with
 * Cache Components enabled a dynamic API cannot be read in the static shell.
 */
export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-gold/40 bg-maroon py-3 text-offwhite">
        <div className="container-page">
          <p className="font-[family-name:var(--font-display)] text-lg">Tulsi Jewellers · Admin</p>
        </div>
      </header>
      {/* `main` so the root layout's "Skip to main content" link has a target here
          too — the admin screens were the only pages without one. */}
      <main id="main-content" className="container-page py-10">
        <div className="mx-auto max-w-xl rounded-sm border border-gold/40 bg-offwhite p-6 shadow-[var(--shadow-soft)]">
          <Suspense fallback={<p className="text-sm text-charcoal/70">Checking your session…</p>}>
            <LoginScreen searchParams={searchParams} />
          </Suspense>
          <p className="mt-6 border-t border-gold/30 pt-4 text-xs">
            <Link href="/" className="text-charcoal/70 hover:text-maroon hover:underline">
              ← Back to the public site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
