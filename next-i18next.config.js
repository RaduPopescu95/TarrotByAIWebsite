const path = require("path");

// Configuration for next-i18next that works on Vercel
const config = {
  i18n: {
    defaultLocale: "ro",
    locales: [
      "en", "ro", "bg", "hr", "cs", "fr", "de", "el", "hi", "id", "it", "pl", "sk", "es"
    ],
    localeDetection: false, // Disable automatic locale detection on Vercel
  },
  localePath: typeof window === 'undefined' ? path.resolve('./public/locales') : '/locales',
  fallbackLng: {
    default: ['ro'],
  },
  // Force loading of resources
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Ensure namespaces are loaded
  ns: ['common'],
  defaultNS: 'common',
  // Disable SSG for better compatibility with Vercel
  serverSideTranslations: true,
  // Prevent issues with client/server mismatch
  interpolation: {
    escapeValue: false,
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development' || process.env.ENABLE_I18N_LOGS === 'true',
  // Ensure proper serialization
  serializeConfig: false,
  // Add load option for production builds
  load: 'languageOnly',
};

// Only log in development and avoid fs operations
if (process.env.NODE_ENV === 'development') {
  console.log('⚙️ [CONFIG] next-i18next.config.js loaded:', {
    defaultLocale: config.i18n.defaultLocale,
    locales: config.i18n.locales,
    localePath: config.localePath,
    environment: process.env.NODE_ENV
  });
}

module.exports = config;