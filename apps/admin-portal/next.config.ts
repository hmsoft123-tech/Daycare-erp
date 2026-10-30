import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Origins the browser may call (API backend). Paths are stripped. */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const connectSrc = [
  "'self'",
  originOf(process.env.NEXT_PUBLIC_API_BASE_URL),
  isDev ? "ws:" : null,
].filter(Boolean);

/**
 * Content-Security-Policy.
 * `'unsafe-inline'` scripts are still required for the color-mode boot script and
 * Next's inline bootstrap — move to per-request nonces in middleware to drop it.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://img.youtube.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(" ")}`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  env: {
    // The address the public proxy presents to the widget endpoints (see widgetOrigin in api-client).
    NEXT_PUBLIC_WIDGET_SITE_ORIGIN:
      process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL
        ? `https://${process.env.VERCEL_BRANCH_URL}`
        : "",
  },
  poweredByHeader: false,
  // Lets a local production build run beside `next dev` without sharing .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Dev tenant subdomains (http://schoola.localhost:3000) load /_next assets and HMR.
  allowedDevOrigins: ["*.localhost"],
  transpilePackages: [
    "@kinder-pilot/ui",
    "@kinder-pilot/api-client",
    "@kinder-pilot/types",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
