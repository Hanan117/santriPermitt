import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:3001"}/uploads/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
