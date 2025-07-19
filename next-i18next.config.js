module.exports = {
  i18n: {
    defaultLocale: "ro",
    locales: [
      "en", // English
      "ro", // Romanian
      "bg", // Bulgarian
      "hr", // Croatian
      "cs", // Czech
      "fr", // French
      "de", // German
      "el", // Greek
      "hi", // Hindi
      "id", // Indonesian
      "it", // Italian
      "pl", // Polish
      "sk", // Slovak
      "es", // Spanish
    ],
  },
  fallbackLng: {
    default: ['ro'],
  },
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Remove localePath to let next-i18next use default path resolution
  // This is more Vercel-compatible
};