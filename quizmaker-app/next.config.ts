import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Experimental features for Cloudflare Workers
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Webpack configuration for Cloudflare Workers
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Polyfill crypto for bcryptjs in Cloudflare Workers
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
