import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Admin product form uploads images through a Server Action (default limit is 1 MB)
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
