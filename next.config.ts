import type { NextConfig } from "next";

// Admin photos upload straight from the browser to Cloudinary, so Server Actions keep the default 1 MB body limit.
const nextConfig: NextConfig = {
  // npm run preview builds into its own folder so it never disturbs the running dev server
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
