import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key:   "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key:   "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline/unsafe-eval for its runtime scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.mlbedgepro.dev https://*.clerk.accounts.dev https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://www.mlbstatic.com https://img.mlbstatic.com",
      "connect-src 'self' https://*.clerk.accounts.dev https://clerk.mlbedgepro.dev https://api.stripe.com wss://*.clerk.accounts.dev",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.mlbstatic.com" },
      { protocol: "https", hostname: "img.mlbstatic.com" },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
