/**
 * Flag assets for language picker / header. Uses legacy filenames where the repo already references them;
 * other codes fall back to `/flags/<code>.png` (same convention as LangSwitch/Select).
 */

const LOCALE_FLAG_SRC = {
  en: "/flags/english.png",
  ro: "/flags/romania.png",
  bg: "/flags/bulgaria.png",
  hr: "/flags/croatia.png",
  cs: "/flags/czech.png",
  fr: "/flags/france.png",
  de: "/flags/germany.png",
  el: "/flags/greece.png",
  hi: "/flags/india.png",
  id: "/flags/indonesia.png",
  it: "/flags/italy.png",
  pl: "/flags/poland.png",
  sk: "/flags/slovakia.png",
  es: "/flags/spanish.png",
  pt: "/flags/pt.png",
  ru: "/flags/ru.png",
  hu: "/flags/hu.png",
  ar: "/flags/ar.png",
  he: "/flags/he.png",
  tr: "/flags/tr.png",
  zh: "/flags/zh.png",
  ja: "/flags/ja.png",
  ko: "/flags/ko.png",
  sq: "/flags/sq.png",
  bs: "/flags/bs.png",
  mn: "/flags/mn.png",
  sr: "/flags/sr.png",
};

/** Native / conventional labels for the public language dialog and dropdown. */
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

function getLocaleFlagSrc(lc) {
  if (!lc || typeof lc !== "string") return LOCALE_FLAG_SRC.en;
  const key = lc.trim().toLowerCase();
  return LOCALE_FLAG_SRC[key] || `/flags/${key}.png`;
}

function getLocaleNativeLabel(lc) {
  if (!lc || typeof lc !== "string") return "";
  const key = lc.trim().toLowerCase();
  return LOCALE_NATIVE_LABEL[key] || key.toUpperCase();
}

module.exports = {
  LOCALE_FLAG_SRC,
  LOCALE_NATIVE_LABEL,
  getLocaleFlagSrc,
  getLocaleNativeLabel,
};
