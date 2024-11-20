import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/votes', // Local endpoint
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/votes`, 
      },
    ];
  },
};

export default nextConfig;
