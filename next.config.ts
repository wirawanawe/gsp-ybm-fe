import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3331',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.18.49',
        port: '3331',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
