/** Native labels and locale abbreviations for language pickers (no flag assets). */

const LOCALE_NATIVE_LABEL = {
  ro: "Română",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  bg: "Български",
  hr: "Hrvatski",
  cs: "Čeština",
  el: "Ελληνικά",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  pl: "Polski",
  sk: "Slovenčina",
  ar: "العربية",
  he: "עברית",
  tr: "Türkçe",
  zh: "中文 (台灣)",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  hu: "Magyar",
  sq: "Shqip",
  bs: "Bosanski",
  mn: "Монгол",
  sr: "Српски",
};

function getLocaleNativeLabel(lc) {
  if (!lc || typeof lc !== "string") return "";
  const key = lc.trim().toLowerCase();
  return LOCALE_NATIVE_LABEL[key] || key.toUpperCase();
}

function getLocaleAbbreviation(lc) {
  if (!lc || typeof lc !== "string") return "EN";
  const key = lc.trim().toLowerCase();
  return LOCALE_NATIVE_LABEL[key] ? key.toUpperCase() : "EN";
}

module.exports = {
  LOCALE_NATIVE_LABEL,
  getLocaleNativeLabel,
  getLocaleAbbreviation,
};
