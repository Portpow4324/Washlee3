import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
