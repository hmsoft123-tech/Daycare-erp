import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@kinder-pilot/ui",
    "@kinder-pilot/api-client",
    "@kinder-pilot/types",
  ],
};

export default nextConfig;
