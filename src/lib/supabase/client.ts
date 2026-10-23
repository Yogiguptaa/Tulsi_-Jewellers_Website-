/**
 * src/lib/supabase/client.ts — browser-side Supabase client.
 *
 * Use from "use client" components that must read/write Supabase directly
 * (e.g. submitting enquiry forms). Server Components should use `server.ts`.
 *
 * Returns `null` when env vars are missing so pages render honest empty
 * states instead of crashing (hard business rule: never fake data).
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Singleton browser client (per browser tab). Returns `null` when
 * NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are not set — callers must handle
 * that by showing an empty state or a "temporarily unavailable" message.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  browserClient = createBrowserClient<Database>(
    supabaseUrl() as string,
    supabaseAnonKey() as string,
  );
  return browserClient;
}
