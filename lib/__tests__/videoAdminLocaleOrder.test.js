const cfg = require("../../next-i18next.config.js");
const {
  VIDEO_ADMIN_LOCALE_DISPLAY_ORDER,
  sortLocalesForVideoAdmin,
} = require("../../src/features/video-library-admin/utils/videoAdminLocaleOrder");

const EXPECTED_ORDER = [
  "sq",
  "ar",
  "bs",
  "bg",
  "cs",
  "zh",
  "ko",
  "hr",
  "he",
  "en",
  "fr",
  "de",
  "el",
  "hi",
  "id",
  "it",
  "ja",
  "hu",
  "mn",
  "pl",
  "pt",
  "ro",
  "ru",
  "sr",
  "sk",
  "es",
  "tr",
];

describe("videoAdminLocaleOrder", () => {
  it("exports the client display order with 27 locales", () => {
    expect([...VIDEO_ADMIN_LOCALE_DISPLAY_ORDER]).toEqual(EXPECTED_ORDER);
    expect(VIDEO_ADMIN_LOCALE_DISPLAY_ORDER.indexOf("ro")).toBe(21);
    expect(VIDEO_ADMIN_LOCALE_DISPLAY_ORDER.indexOf("hi")).toBe(13);
    expect(VIDEO_ADMIN_LOCALE_DISPLAY_ORDER.indexOf("id")).toBe(14);
  });

  it("sorts all site locales into the display order", () => {
    const siteLocales = cfg.i18n.locales;
    const sorted = sortLocalesForVideoAdmin(siteLocales);
    expect(sorted).toEqual(EXPECTED_ORDER);
    expect(sorted.length).toBe(siteLocales.length);
  });

  it("appends unknown locale codes at the end", () => {
    const sorted = sortLocalesForVideoAdmin(["ro", "xx-new"]);
    expect(sorted[0]).toBe("ro");
    expect(sorted[sorted.length - 1]).toBe("xx-new");
  });
});
