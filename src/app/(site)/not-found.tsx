import NotFoundView from "@/components/content/NotFoundView";

/**
 * The 404 for a `notFound()` thrown inside the public site (an unknown product
 * slug, for example).
 *
 * It deliberately renders the message ONLY: `(site)/layout.tsx` already wraps
 * everything below it in the site chrome. The previous version fell through to
 * `src/app/not-found.tsx`, which adds its own chrome — so a missing product
 * printed the header and footer twice.
 *
 * `src/app/not-found.tsx` keeps its own chrome, because a URL that matches no
 * route at all never passes through this layout.
 */
export default function SiteNotFound() {
  return <NotFoundView />;
}
