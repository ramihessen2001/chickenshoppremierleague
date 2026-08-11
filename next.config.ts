import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},
  
  // Add image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yftkacstyuhjhnmebgzv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
