/**
 * src/lib/supabase/server.ts — server-side Supabase client (App Router).
 *
 * Use from Server Components, Route Handlers and Server Actions.
 * Creates a fresh client per request — never cache the result.
 *
 * Cache Components note: this reads `cookies()`, so calling it from a page
 * must sit behind a <Suspense> boundary (Next 16 build error otherwise).
 * Prefer calling it in Route Handlers (Stage 5 cron callbacks, Stage 8 admin
 * APIs) or in Suspense-wrapped server components.
 *
 * Returns `null` when env vars are missing so the site can render honest
 * empty states before a Supabase project exists.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Per-request server client with cookie-backed session storage.
 * Always `await` this — never store the result across requests.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl() as string, supabaseAnonKey() as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where writes are forbidden.
          // Safe to ignore: session refresh is handled in middleware/route
          // handlers if needed later.
        }
      },
    },
  });
}
