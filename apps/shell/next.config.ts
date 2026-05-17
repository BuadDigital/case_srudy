import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Hide the floating "N" dev badge (bottom-left) during `npm run dev`. */
  devIndicators: false,
  transpilePackages: [
    "@platform/api-client",
    "@platform/auth-client",
    "@platform/design-system",
    "@platform/types",
  ],
};

export default nextConfig;
