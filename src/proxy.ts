/**
 * src/proxy.ts — Next.js 16 Proxy (= the old middleware).
 *
 * Two jobs, both deliberately cheap:
 *  1. Refresh the Supabase auth cookies once per navigation (single-use refresh
 *     tokens make this the recommended place to do it).
 *  2. Optimistically send a signed-out visitor to the login screen instead of
 *     rendering the panel and bouncing.
 *
 * ⚠️ This is UX, NOT security. The authoritative check is the Data Access Layer
 * in `src/lib/admin/auth.ts`, which every admin page and Server Action calls.
 * The Proxy only reads the session cookie/session; it never queries the
 * `admin_users` allowlist, because Proxy runs on prefetches too.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_ROOT = "/admin";
const LOGIN_PATH = "/admin/login";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No Supabase project yet → nothing to gate. The DAL reports `unconfigured`
  // and the panel shows setup instructions instead of a crash.
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write onto the request so the render that follows sees the new value …
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // … and onto the response so the browser stores the refreshed session.
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === LOGIN_PATH || path === `${LOGIN_PATH}/`;

  if (!user && !isLogin) {
    const login = new URL(LOGIN_PATH, request.url);
    // Only ever a same-site admin path; validated again before use.
    login.searchParams.set("next", path.startsWith(ADMIN_ROOT) ? path : ADMIN_ROOT);
    return NextResponse.redirect(login);
  }

  // A signed-in user is NOT redirected away from the login screen: they may be
  // signed in but absent from `admin_users`, and they need that screen to sign
  // out or switch accounts. The DAL decides what they actually see.
  return response;
}

export const config = {
  /** Only the admin area — the public site must stay as fast as possible. */
  matcher: ["/admin", "/admin/:path*"],
};
