import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['172.20.10.3'],
  async redirects() {
    return [
      // "Wholesale" / "Corporate" replaced by the unified Business Laundry route.
      { source: '/wholesale', destination: '/business', permanent: true },
      { source: '/corporate', destination: '/business', permanent: true },
    ]
  },
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
