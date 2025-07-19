/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = { 
  i18n,
  // Important for Vercel: ensure proper builds
  poweredByHeader: false,
  // Important: ensure proper static optimization
  reactStrictMode: true,
  // Important: ensure proper image optimization
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60
  },
  // Important: ensure proper compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  },
  // Important: ensure proper webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      };
    }
    return config;
  },
  // Important: ensure proper environment variables
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // Important: ensure proper redirects if needed
  async redirects() {
    return [];
  },
  // Important: ensure proper headers for i18n
  async headers() {
    return [
      {
        source: '/locales/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
