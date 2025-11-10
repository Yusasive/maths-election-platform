import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/votes',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/votes/`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
