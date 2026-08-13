import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/marketplace-reference.html",
        },
      ],
    };
  },
};

export default nextConfig;
