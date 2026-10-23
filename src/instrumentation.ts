/**
 * instrumentation.ts — runs once when the Next.js server starts.
 *
 * Why: the daily schedule (Vercel Cron / GitHub Actions) does not exist on a
 * laptop, so a fresh `npm run dev` would show "rate being updated" until
 * somebody opened the rates page and waited for a refresh. On boot we ask the
 * same job for one refresh. It is safe because the job itself checks whether a
 * value fresher than RATE_REFRESH_AFTER_HOURS already exists, takes the refresh
 * lock and refuses to spend the last 10% of the monthly allowance.
 *
 * A failure here never blocks the server: the page still renders the last
 * verified rate, or the honest "call us" message.
 */

export async function register() {
  // Edge runtime has no filesystem and no Supabase admin client.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Never fetch during `next build`.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  try {
    const { refreshRatesIfStale } = await import("@/lib/rates/lazy");
    // Bounded: a slow provider must not delay the first request indefinitely.
    await Promise.race([
      refreshRatesIfStale().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ]);

    // A long-running local or self-hosted server keeps itself current without a
    // cron: every 6 hours it asks the same guarded job. On a serverless host the
    // process is gone long before this fires, so Vercel Cron / Actions remain the
    // schedule there. `unref()` keeps the timer from holding the process open.
    const timer = setInterval(() => {
      void refreshRatesIfStale().catch(() => undefined);
    }, 6 * 60 * 60 * 1000);
    timer.unref?.();
  } catch {
    // Boot must never fail because a rate refresh did.
  }
}
