import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@kinder-pilot/ui",
    "@kinder-pilot/api-client",
    "@kinder-pilot/types",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
