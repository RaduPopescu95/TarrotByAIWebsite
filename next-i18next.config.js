const path = require("path");

// Simple config without fs operations (fs not available in client build)
const config = {
  i18n: {
    defaultLocale: "ro", 
    locales: [
      "en", "ro", "bg", "hr", "cs", "fr", "de", "el", "hi", "id", "it", "pl", "sk", "es"
    ],
  },
  localePath: path.resolve("./public/locales"),
  ssg: false,
  localeSubpaths: false,
};

// Only log in development and avoid fs operations
if (process.env.NODE_ENV === 'development') {
  console.log('⚙️ [CONFIG] next-i18next.config.js loaded:', {
    defaultLocale: config.i18n.defaultLocale,
    locales: config.i18n.locales,
    localePath: config.localePath
  });
}

module.exports = config;