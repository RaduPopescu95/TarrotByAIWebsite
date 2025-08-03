/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = { 
  i18n,
  // Important for Vercel: ensure proper builds
  poweredByHeader: false,
  // Important: ensure proper static optimization
  reactStrictMode: true,
  // Fix ES6 module import issues
  transpilePackages: ['agora-react-uikit', 'agora-rtc-sdk-ng', 'firebase', '@firebase/app', '@firebase/firestore'],
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['firebase-admin', 'firebase', '@firebase/app']
  },
  // Ensure proper module resolution
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}'
    }
  },
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
    // Fix ES module issues
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs']
    };
    
    // Optimize for production
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      };
    }
    
    // Handle ES modules in dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      buffer: false,
      events: false,
    };

    // Exclude Firebase from server-side bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('firebase/app');
      config.externals.push('firebase/firestore');
      config.externals.push('firebase/auth');
      config.externals.push('firebase/storage');
      config.externals.push('firebase/database');
      config.externals.push('firebase/functions');
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
