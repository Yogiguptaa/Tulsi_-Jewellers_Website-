import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/**
 * Crawler policy. Only the pages that exist for visitors are allowed; the API
 * routes and the admin surface are kept out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  const base = SITE.baseUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/wishlist"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
