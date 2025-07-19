/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = { 
  i18n,
  // Optimize for Vercel deployment
  experimental: {
    // Improve i18n performance on Vercel
    optimizeCss: true,
    serverComponentsExternalPackages: ['next-i18next'],
  },
  // Ensure proper static file serving for locales
  async rewrites() {
    return [
      {
        source: '/locales/:path*',
        destination: '/public/locales/:path*',
      },
    ];
  },
  // Add headers for better caching of translation files
  async headers() {
    return [
      {
        source: '/locales/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },
  // Ensure webpack handles i18n correctly
  webpack: (config, { isServer, dev }) => {
    // Only optimize in production
    if (!dev && !isServer) {
      // Optimize i18n bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ensure consistent path resolution for translations
        '@/locales': require('path').resolve(__dirname, 'public/locales'),
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
