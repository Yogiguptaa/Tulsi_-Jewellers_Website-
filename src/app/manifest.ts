import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/**
 * Web app manifest — lets a visitor add the site to their phone's home screen.
 *
 * Only the brand mark and the two colours are declared; there is no service
 * worker yet, so nothing is cached offline and no rate is ever served from a
 * stale copy. The shortcuts are ordinary links to pages that exist.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name.en} — ${SITE.name.hi}`,
    short_name: SITE.name.en,
    description: SITE.defaultMetaDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#5a0f1b",
    lang: SITE.defaultLanguage,
    dir: "auto",
    categories: ["shopping", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Today's rates", url: "/rates" },
      { name: "Collections", url: "/collections" },
      { name: "Visit us", url: "/visit-us" },
    ],
  };
}
