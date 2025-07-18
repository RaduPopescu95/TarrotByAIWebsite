const path = require("path");

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
      // Adaugă aici alte locale
    ],
    localeDetection: true,
  },
  localePath: path.resolve("./public/locales"),
  ssg: true,
  localeSubpaths: true,
  reloadOnPrerender: true,
};
