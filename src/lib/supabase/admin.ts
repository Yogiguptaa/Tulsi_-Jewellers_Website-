/**
 * src/lib/supabase/admin.ts — privileged service-role client.
 *
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY bypasses RLS. NEVER import this from a client
 * component or expose the key with a NEXT_PUBLIC_ prefix. Use only in:
 *   - Route Handlers (Stage 5 rate cron, Stage 8 admin APIs)
 *   - Server Actions that have already verified the caller is an admin
 *
 * Returns `null` when env vars are missing (honest-empty-state fallback) or
 * when accidentally called in the browser.
 */
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Reads SUPABASE_SERVICE_ROLE_KEY from server env only. Kept here (not in
 * env.ts) so this key never appears in any module imported by client code.
 */
function serviceRoleKey(): string | null {
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("serviceRoleKey() was called in the browser.");
    }
    return null;
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Singleton service-role client (server only).
 * Session persistence is disabled — the service role never signs in.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  const serviceKey = serviceRoleKey(); // throws in browser (dev)
  const url = supabaseUrl();
  if (!url || !serviceKey) return null;

  if (adminClient) return adminClient;

  adminClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return adminClient;
}
