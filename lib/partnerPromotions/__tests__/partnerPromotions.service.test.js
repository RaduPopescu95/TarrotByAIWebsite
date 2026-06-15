import {
  computeNextPartnerPromotionChangeAtMs,
  filterPublicPartnerPromotions,
  isPartnerPromotionLive,
  matchesPartnerPromotionLocale,
  resolvePartnerPromotionLinkUrl,
  validatePartnerPromotionInput,
} from "../partnerPromotions.service";

const NOW = Date.parse("2026-06-15T12:00:00.000Z");

const baseRow = {
  id: "p1",
  name: "Partner A",
  logoUrl: "https://example.com/logo.png",
  description: "Short promo",
  linkUrl: "https://example.com",
  linkType: "website",
  displayStartAt: "2026-06-01T00:00:00.000Z",
  displayEndAt: "2026-06-30T23:59:59.000Z",
  isActive: true,
  placements: ["web_home_top", "app_dashboard"],
  sortOrder: 2,
  locale: "all",
};

describe("partnerPromotions.service", () => {
  describe("isPartnerPromotionLive", () => {
    it("returns false when inactive", () => {
      expect(isPartnerPromotionLive({ ...baseRow, isActive: false }, NOW)).toBe(false);
    });

    it("returns false before start and after end", () => {
      expect(
        isPartnerPromotionLive(
          { ...baseRow, displayStartAt: "2026-06-20T00:00:00.000Z" },
          NOW
        )
      ).toBe(false);
      expect(
        isPartnerPromotionLive(
          { ...baseRow, displayEndAt: "2026-06-10T00:00:00.000Z" },
          NOW
        )
      ).toBe(false);
    });

    it("returns true inside the display window", () => {
      expect(isPartnerPromotionLive(baseRow, NOW)).toBe(true);
    });
  });

  describe("matchesPartnerPromotionLocale", () => {
    it("matches all locales when locale is all", () => {
      expect(matchesPartnerPromotionLocale({ locale: "all" }, "ro")).toBe(true);
      expect(matchesPartnerPromotionLocale({ locale: "all" }, "en")).toBe(true);
    });

    it("matches only configured locale", () => {
      expect(matchesPartnerPromotionLocale({ locale: "ro" }, "ro")).toBe(true);
      expect(matchesPartnerPromotionLocale({ locale: "ro" }, "en")).toBe(false);
    });
  });

  describe("filterPublicPartnerPromotions", () => {
    const rows = [
      baseRow,
      {
        ...baseRow,
        id: "p2",
        name: "Partner B",
        sortOrder: 1,
        placements: ["web_home_top"],
        isActive: false,
      },
      {
        ...baseRow,
        id: "p3",
        name: "Partner C",
        sortOrder: 0,
        placements: ["app_dashboard"],
        locale: "en",
      },
    ];

    it("filters by placement, active state, date window, and locale", () => {
      const webTop = filterPublicPartnerPromotions(rows, {
        placement: "web_home_top",
        locale: "ro",
        nowMs: NOW,
      });
      expect(webTop.map((row) => row.id)).toEqual(["p1"]);

      const appDashboard = filterPublicPartnerPromotions(rows, {
        placement: "app_dashboard",
        locale: "ro",
        nowMs: NOW,
      });
      expect(appDashboard.map((row) => row.id)).toEqual(["p1"]);

      const appDashboardEn = filterPublicPartnerPromotions(rows, {
        placement: "app_dashboard",
        locale: "en",
        nowMs: NOW,
      });
      expect(appDashboardEn.map((row) => row.id)).toEqual(["p3", "p1"]);
    });

    it("sorts by sortOrder then name", () => {
      const sorted = filterPublicPartnerPromotions(
        [
          { ...baseRow, id: "z", name: "Zeta", sortOrder: 1 },
          { ...baseRow, id: "a", name: "Alpha", sortOrder: 1 },
          { ...baseRow, id: "b", name: "Beta", sortOrder: 0 },
        ],
        { placement: "web_home_top", locale: "ro", nowMs: NOW }
      );
      expect(sorted.map((row) => row.id)).toEqual(["b", "a", "z"]);
    });

    it("returns empty array for invalid placement", () => {
      expect(
        filterPublicPartnerPromotions(rows, {
          placement: "invalid_zone",
          locale: "ro",
          nowMs: NOW,
        })
      ).toEqual([]);
    });
  });

  describe("computeNextPartnerPromotionChangeAtMs", () => {
    it("returns earliest future start or end among active rows", () => {
      const next = computeNextPartnerPromotionChangeAtMs(
        [
          {
            ...baseRow,
            displayStartAt: "2026-06-01T00:00:00.000Z",
            displayEndAt: "2026-06-20T00:00:00.000Z",
          },
          {
            ...baseRow,
            id: "future",
            displayStartAt: "2026-06-18T00:00:00.000Z",
            displayEndAt: "2026-07-01T00:00:00.000Z",
          },
        ],
        NOW
      );
      expect(next).toBe(Date.parse("2026-06-18T00:00:00.000Z"));
    });
  });

  describe("resolvePartnerPromotionLinkUrl", () => {
    it("prefixes whatsapp numbers", () => {
      expect(resolvePartnerPromotionLinkUrl("40712345678", "whatsapp")).toBe(
        "https://wa.me/40712345678"
      );
    });

    it("keeps regular urls unchanged", () => {
      expect(resolvePartnerPromotionLinkUrl("https://shop.example", "store")).toBe(
        "https://shop.example"
      );
    });
  });

  describe("validatePartnerPromotionInput", () => {
    it("requires core fields on create", () => {
      const result = validatePartnerPromotionInput({
        name: "Firma",
        logoUrl: "https://img.test/logo.png",
        description: "Descriere scurta",
        linkUrl: "https://firma.test",
        linkType: "website",
        displayStartAt: "2026-06-01",
        displayEndAt: "2026-06-30",
        isActive: true,
        placements: ["web_home_top"],
        sortOrder: 0,
        locale: "all",
      });
      expect(result.ok).toBe(true);
    });

    it("rejects empty placements", () => {
      const result = validatePartnerPromotionInput({
        name: "Firma",
        logoUrl: "https://img.test/logo.png",
        description: "Descriere scurta",
        linkUrl: "https://firma.test",
        linkType: "website",
        displayStartAt: "2026-06-01",
        displayEndAt: "2026-06-30",
        isActive: true,
        placements: [],
        sortOrder: 0,
        locale: "all",
      });
      expect(result.ok).toBe(false);
      expect(result.errors).toContain("placements");
    });
  });
});
