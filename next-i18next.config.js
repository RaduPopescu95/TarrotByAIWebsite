const path = require("path");
const fs = require("fs");

const localePath = path.resolve("./public/locales");

console.log('⚙️ [CONFIG] next-i18next.config.js loading:', {
  localePath,
  localePathExists: fs.existsSync(localePath),
  env: process.env.NODE_ENV,
  isVercel: !!process.env.VERCEL,
  cwd: process.cwd()
});

// Check if locale files exist
const locales = [
  "en", "ro", "bg", "hr", "cs", "fr", "de", "el", "hi", "id", "it", "pl", "sk", "es"
];

locales.forEach(locale => {
  const localeDir = path.join(localePath, locale);
  const commonFile = path.join(localeDir, "common.json");
  
  console.log(`📁 [CONFIG] Checking locale ${locale}:`, {
    localeDir,
    dirExists: fs.existsSync(localeDir),
    commonExists: fs.existsSync(commonFile),
    files: fs.existsSync(localeDir) ? fs.readdirSync(localeDir) : []
  });
});

const config = {
  i18n: {
    localePath,
    defaultLocale: "ro", 
    locales,
  },
  ssg: false,
  localeSubpaths: false,
};

console.log('✅ [CONFIG] Final next-i18next config:', config);

module.exports = config;