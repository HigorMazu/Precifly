import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "*.mlstatic.com" },
      { protocol: "https", hostname: "cdn.dummyjson.com" },
    ],
  },
};

export default nextConfig;
