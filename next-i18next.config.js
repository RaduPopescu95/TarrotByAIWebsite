const path = require("path");

// Production-ready configuration for next-i18next
const config = {
  i18n: {
    defaultLocale: "ro",
    locales: [
      "ar",
      "bg",
      "bs",
      "cs",
      "de",
      "el",
      "en",
      "es",
      "fr",
      "he",
      "hi",
      "hr",
      "hu",
      "id",
      "it",
      "ja",
      "ko",
      "mn",
      "pl",
      "pt",
      "ro",
      "ru",
      "sk",
      "sq",
      "sr",
      "tr",
      "zh",
    ]
  },
  // Use relative path that works both locally and on Vercel
  localePath: path.resolve('./public/locales'),
  // Important: ensure proper fallback behavior
  fallbackLng: "ro",
  // Important for server-side rendering
  react: {
    useSuspense: false
  },
  // Debug only in development
  debug: process.env.NODE_ENV === 'development',
  // Important: ensure proper return for missing keys
  returnEmptyString: false,
  // Ensure proper pluralization
  pluralSeparator: '_',
  // Context separator
  contextSeparator: '_',
  // Important: detection settings
  detection: {
    order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
    caches: ['cookie', 'localStorage'],
    lookupCookie: 'NEXT_LOCALE',
    lookupLocalStorage: 'locale',
    checkWhitelist: true
  }
};

// Only log configuration in development to avoid Vercel function timeouts
if (process.env.NODE_ENV === 'development') {
  console.log('⚙️ [CONFIG] next-i18next.config.js loaded:', {
    defaultLocale: config.i18n.defaultLocale,
    locales: config.i18n.locales,
    localePath: config.localePath,
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });
}

module.exports = config;