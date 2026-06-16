const fs = require("fs");
const path = require("path");

const nextI18nRoot = require("../../next-i18next.config.js");
const LOCALES_DIR = path.join(__dirname, "../../public/locales");
const SOURCE_LOCALE = "en";

const SITE_LOCALES = Array.isArray(nextI18nRoot.i18n?.locales)
  ? [...nextI18nRoot.i18n.locales]
  : ["ro", "en"];

function loadJson(locale) {
  const filePath = path.join(LOCALES_DIR, locale, "common.json");
  expect(fs.existsSync(filePath)).toBe(true);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("web locale parity", () => {
  const source = loadJson(SOURCE_LOCALE);
  const sourceKeys = Object.keys(source);

  it("source locale has keys", () => {
    expect(sourceKeys.length).toBeGreaterThan(100);
  });

  for (const locale of SITE_LOCALES) {
    it(`${locale}/common.json has same keys as ${SOURCE_LOCALE}`, () => {
      const target = loadJson(locale);
      expect(Object.keys(target).sort()).toEqual(sourceKeys.sort());
    });

    it(`${locale} has no empty string values`, () => {
      const target = loadJson(locale);
      for (const key of sourceKeys) {
        expect(typeof target[key]).toBe("string");
        expect(target[key].trim().length).toBeGreaterThan(0);
      }
    });
  }
});
