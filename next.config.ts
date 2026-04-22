import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.20.10.3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'reviewed-com-res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'www.thatpracticalmom.com',
      },
      {
        protocol: 'https',
        hostname: 'www.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
    ],
  },
};

export default nextConfig;
