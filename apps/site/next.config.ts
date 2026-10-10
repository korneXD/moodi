import type { NextConfig } from "next";

// Next.js hydrates with inline scripts and styles, so those stay allowed; everything else is pinned to this site
// and the DataFast analytics script.
// three.js needs no eval. Dev mode needs eval for hot reloading.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://datafa.st${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://datafa.st",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Pages are not meant to be read cross-origin; Vercel would otherwise send "Access-Control-Allow-Origin: *" on prerendered pages.
  { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getmoodi.dev" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/((?!_next/).*)", headers: securityHeaders }];
  },
};

export default nextConfig;
