module.exports = {
  i18n: {
    defaultLocale: "en",
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
    default: ['en'],
  },
  debug: false,
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};