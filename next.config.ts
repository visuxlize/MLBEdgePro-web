import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js doesn't walk up
  // and find the lockfile at /Users/dre/Developer/package-lock.json
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Local screenshots in /public/screenshots/ are served directly — no config needed.
    // Remote MLB logos from their CDN:
    remotePatterns: [
      { protocol: "https", hostname: "www.mlbstatic.com" },
      { protocol: "https", hostname: "img.mlbstatic.com" },
    ],
    // Allow unoptimized for the app screenshots so they render as-is
    unoptimized: false,
  },
};

export default nextConfig;
