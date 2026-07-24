/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = { 
  i18n,
  experimental: {
    instrumentationHook: true,
  },
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
    const adminPaths = [
      "abonati",
      "user-tokens",
      "analytics",
      "astrograme-pdf",
      "setari",
      "ads-orchestration",
      "comentarii-video",
      "statistici-video",
    ];
    return adminPaths.map((path) => ({
      source: `/dashboard/${path}`,
      destination: `/administrare/${path}`,
      permanent: true,
    }));
  },
  // Important: ensure proper headers for i18n
  async headers() {
    return [
      {
        source: '/locales/:path*',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          }
        ]
      },
      {
        source: '/.well-known/:path*',
        locale: false,
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      }
    ];
  }
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
