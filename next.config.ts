import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/votes',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/votes/`, 
      },
    ];
  },
};

export default nextConfig;
