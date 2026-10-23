/**
 * Copyright year for the footer.
 *
 * Next.js `cacheComponents` forbids reading the clock during static prerender,
 * so the value is wrapped in a `"use cache"` function: it is computed once and
 * reused for every render of the cached route.
 */
export async function getCopyrightYear(): Promise<number> {
  "use cache";
  return new Date().getFullYear();
}
