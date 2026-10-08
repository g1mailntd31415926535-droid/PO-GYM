import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lyfta.app',
        pathname: '/images/exercises/**',
      },
    ],
  },
};

export default nextConfig;
