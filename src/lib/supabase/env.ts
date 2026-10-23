/**
 * src/lib/supabase/env.ts — shared env access for the Supabase clients.
 *
 * - NEXT_PUBLIC_* vars are inlined by Next at build time; safe anywhere.
 * - No file here throws when env is missing: the site must build and render
 *   honest empty states before a Supabase project exists (Stage 2 has no
 *   credentials yet). Callers get `null` and fall back.
 */

/** True once NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are both present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
}

export function supabaseAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
}

// NOTE: SUPABASE_SERVICE_ROLE_KEY is deliberately NOT read here — this module
// is reachable from client components via getSupabaseBrowserClient(). The
// service-role accessor lives in admin.ts (server-only).
