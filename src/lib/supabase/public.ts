/**
 * supabase/public.ts — a read-only Supabase client for PUBLIC data.
 *
 * Uses the anon key (never the service-role key) and no cookies/session, so it
 * is safe to call from cached server functions and from route handlers that must
 * not become dynamic. Every table it reads has an anon-read RLS policy that only
 * exposes public rows (for example `products.status = 'active'`).
 *
 * Returns null when Supabase is not configured so callers render the honest
 * empty catalogue and "rate unavailable" states.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

export function publicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
