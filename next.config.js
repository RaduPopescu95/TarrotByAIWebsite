/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = { 
  i18n,
  // Important for Vercel: ensure proper builds
  poweredByHeader: false,
  // Important: ensure proper static optimization
  reactStrictMode: true,
  // Fix ES6 module import issues - OPTIMIZED FOR BUILD SPEED
  transpilePackages: ['agora-react-uikit'], // Doar ce e absolut necesar
  experimental: {
    esmExternals: false, // Disable pentru viteza de build
    serverComponentsExternalPackages: ['firebase-admin']
  },
  // Skip modular imports pentru viteza de build
  // Important: ensure proper image optimization
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60
  },
  // Skip compiler optimizations pentru viteza de build în development
  // Important: ensure proper webpack configuration - OPTIMIZED FOR SPEED
  webpack: (config, { dev, isServer }) => {
    // Minimal configuration pentru viteza de build
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      };
    }
    
    // Doar fallback-urile esențiale
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Exclude doar Firebase critical din server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('firebase/app');
      config.externals.push('firebase/firestore');
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
        locale: false,
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
