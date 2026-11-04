import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Deliberately conservative: only directives that cannot break the site are set.
 * A full `script-src` policy needs per-request nonces, and a wrong one silently
 * breaks the admin panel — that work belongs with a hosting review, not here. The
 * directives below do hold: the site cannot be framed (clickjacking), a browser
 * cannot sniff a different content type, a `<base>` tag injected into the HTML
 * cannot redirect relative URLs, and no plugin content is allowed.
 *
 * `Permissions-Policy` denies the device APIs the site never asks for. Geolocation
 * stays available to this origin only, because the Visit page offers an opt-in
 * distance estimate and never reads the location without the visitor pressing it.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
  },
  // Only honoured over HTTPS; harmless locally.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  /**
   * Build stamp for /api/version. Next evaluates this config once per build, so
   * the value is the time the bundle was produced — not the time it was served.
   */
  env: { NEXT_PUBLIC_BUILD_TIME: new Date().toISOString() },
  partialPrefetching: true,
  // Do not advertise the framework version to the network.
  poweredByHeader: false,
  /**
   * Remote product photography.
   *
   * The catalogue stores image paths, never uploads, so an owner who already has
   * photographs in Cloudinary can paste the delivery URL into the CSV. Only the
   * delivery host is allowed — the same allow-list the importer enforces — and no
   * Cloudinary credential is involved, because signed uploads are not used.
   */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [
      {
        // Everything, including the API routes.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
