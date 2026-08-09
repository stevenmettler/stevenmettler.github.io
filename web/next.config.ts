import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    viewTransition: true,
  },
  async redirects() {
    return [
      // Keep links to the previous resume working.
      {
        source: "/MettlerResume2025.pdf",
        destination: "/MettlerResume2026.pdf",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
