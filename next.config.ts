import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allows a second dev server (e.g. NEXT_DIST_DIR=.next-alt next dev -p 3100) without clobbering .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // product photos uploaded from the admin live in Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4.5mb" }, // product image uploads (Vercel request limit)
  },
};

export default nextConfig;
