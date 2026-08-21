import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase authentication production deployment marker.
  transpilePackages: ["@marketplace/api-client", "@marketplace/types", "@marketplace/ui"],
};

export default nextConfig;
