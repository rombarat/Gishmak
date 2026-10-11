import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allows a second dev server (e.g. NEXT_DIST_DIR=.next-alt next dev -p 3100) without clobbering .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: { bodySizeLimit: "5mb" }, // product image uploads
  },
};

export default nextConfig;
