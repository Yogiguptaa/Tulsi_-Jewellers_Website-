/**
 * admin/auth.ts — the Data Access Layer (DAL) for /admin.
 *
 * This is the ONE place that decides whether a request may see admin data. Every
 * admin page and every admin Server Action calls it; nothing else is trusted,
 * including `src/proxy.ts`, which only performs an optimistic redirect and is
 * explicitly *not* a security boundary (see the Proxy docs).
 *
 * Access = a Supabase Auth session AND a matching row in `public.admin_users`.
 * The `admin_users` read is backed by RLS ("self or admin select"), so even this
 * check is enforced by Postgres, not just by this file.
 *
 * When Supabase is not configured the gate reports `unconfigured` instead of
 * throwing, so the panel can render setup instructions rather than a crash.
 */

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ROUTES } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/supabase/types";

export type AdminIdentity = {
  /** Supabase auth user id. */
  id: string;
  email: string;
  role: AdminRole;
};

export type AdminGate =
  /** No Supabase project wired up — the panel shows setup steps, never data. */
  | { status: "unconfigured" }
  /** Supabase is configured but nobody is signed in. */
  | { status: "signed_out" }
  /** Signed in, but the account is not on the admin allowlist. */
  | { status: "forbidden"; email: string }
  | { status: "ok"; admin: AdminIdentity };

/**
 * Resolve the current admin (or the reason there is none).
 * Wrapped in React `cache` so a layout, a page and several components in one
 * render pass share a single auth round-trip.
 */
export const getAdminGate = cache(async (): Promise<AdminGate> => {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "unconfigured" };

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) return { status: "signed_out" };

  const { data: row } = await supabase
    .from("admin_users")
    .select("user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) return { status: "forbidden", email: user.email ?? "(no email on this account)" };

  return {
    status: "ok",
    admin: {
      id: row.user_id,
      email: row.email,
      // The DB enum only allows 'owner' | 'staff'.
      role: row.role === "owner" ? "owner" : "staff",
    },
  };
});

/**
 * For pages: return the admin or send the visitor to the login screen.
 * `redirect()` throws, so the return type is never actually the "no admin" case.
 *
 * `connection()` is called first so the page is never prerendered. An admin
 * screen must be produced per request: if a deployment were built without the
 * Supabase environment variables, a prerendered screen would bake in the
 * "setup needed" state and keep showing it after the keys were added. Every call
 * site sits inside a `<Suspense>` boundary, which this requires. Actions use
 * `getAdminGate()` (which is not request-time) rather than this function.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  await connection();
  const gate = await getAdminGate();
  if (gate.status === "ok") return gate.admin;
  redirect(`${ROUTES.admin}/login`);
}

/** True when this session may delete records and edit pricing rules. */
export function isOwner(admin: AdminIdentity): boolean {
  return admin.role === "owner";
}
