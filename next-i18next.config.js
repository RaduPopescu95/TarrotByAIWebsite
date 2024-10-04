const path = require("path");

module.exports = {
  i18n: {
    localePath: path.resolve("./public/locales"),
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
  },
  ssg: false,
  localeSubpaths: false,
};
