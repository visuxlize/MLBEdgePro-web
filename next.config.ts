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
      // Expanded img-src: MLB assets, ESPN stadiums, Google/Clerk avatars
      "img-src 'self' data: blob:" +
        " https://www.mlbstatic.com" +
        " https://img.mlbstatic.com" +
        " https://a.espncdn.com" +
        " https://lh3.googleusercontent.com" +
        " https://img.clerk.com" +
        " https://*.clerk.com" +
        " https://*.clerk.accounts.dev" +
        " https://images.clerk.dev",
      "connect-src 'self' https://*.clerk.accounts.dev https://clerk.mlbedgepro.dev https://api.stripe.com wss://*.clerk.accounts.dev https://statsapi.mlb.com https://api.the-odds-api.com https://cdn.jsdelivr.net",
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
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
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
