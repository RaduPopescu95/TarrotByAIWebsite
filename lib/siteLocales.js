/**
 * Routing locale vs UI locale (next-i18next namespaces).
 *
 * --- Adding a new language (video / Bunny first, UI later) ---
 * 1. Add the code to `locales` in `next-i18next.config.js`.
 * 2. Add its code below to `LOCALES_WITH_UI_FALLBACK_TO_EN` until `public/locales/<code>/common.json` is fully maintained.
 * 3. Add flag image + label in `components/LangSwitch` and `LANGUAGE_LABELS` in `data/constants` if needed.
 * 4. In admin, set per-locale Bunny URLs on each video (`locales.<code>.videoUrl`).
 * 5. Optional: for SSR outside videoteca, use `resolveUiLocale(locale)` in `serverSideTranslations(...)` like `pages/videouri/*`.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
const nextI18nRoot = require("../next-i18next.config.js");

const SITE_LOCALES =
  Array.isArray(nextI18nRoot.i18n?.locales) && nextI18nRoot.i18n.locales.length > 0
    ? [...nextI18nRoot.i18n.locales]
    : ["ro"];

const DEFAULT_SITE_LOCALE =
  typeof nextI18nRoot.i18n?.defaultLocale === "string" ? nextI18nRoot.i18n.defaultLocale : "ro";

/**
 * ISO-ish locale codes that should load English UI (`common`) while URLs and video API keep the routing locale.
 * Keep empty when every configured locale has its own `public/locales/<code>/common.json` maintained.
 */
const LOCALES_WITH_UI_FALLBACK_TO_EN = new Set();

function normalizeLocaleCode(raw) {
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_SITE_LOCALE;
  return raw.trim().toLowerCase().replace("_", "-").split("-")[0];
}

/**
 * Locale passed to `serverSideTranslations` / `i18n.changeLanguage`.
 * Routing locale (`router.locale`) stays unchanged for URLs and `?locale=` on videoteca APIs.
 *
 * @param {string | undefined} routerLocale
 * @returns {string}
 */
function resolveUiLocale(routerLocale) {
  const lc = normalizeLocaleCode(routerLocale);
  if (!SITE_LOCALES.includes(lc)) {
    return DEFAULT_SITE_LOCALE;
  }
  if (LOCALES_WITH_UI_FALLBACK_TO_EN.has(lc)) {
    return "en";
  }
  return lc;
}

module.exports = {
  SITE_LOCALES,
  DEFAULT_SITE_LOCALE,
  LOCALES_WITH_UI_FALLBACK_TO_EN,
  normalizeLocaleCode,
  resolveUiLocale,
};
