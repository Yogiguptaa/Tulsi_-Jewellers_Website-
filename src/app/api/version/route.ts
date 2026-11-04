import { NextResponse } from "next/server";

/**
 * GET /api/version — proof of which commit is actually serving traffic.
 *
 * Values come from Vercel's own build environment, so they cannot report a
 * commit that was never deployed. No secrets, no environment dumps.
 *
 * With `cacheComponents` enabled a GET handler is already dynamic; declaring
 * `dynamic = "force-dynamic"` here is a build error, so the no-store header
 * below is what keeps the answer current.
 */
export async function GET() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "unknown";

  return NextResponse.json(
    {
      commit,
      shortCommit: commit === "unknown" ? commit : commit.slice(0, 7),
      builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    },
  );
}
