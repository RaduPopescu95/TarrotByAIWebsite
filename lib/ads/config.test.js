import {
  isAdsterraRouteEligible,
  isAdsenseRouteEligible,
  getAdsterraPlacementKey,
} from "./config";

describe("ads config", () => {
  describe("isAdsterraRouteEligible", () => {
    it("allows public content and reading routes", () => {
      expect(isAdsterraRouteEligible("/")).toBe(true);
      expect(isAdsterraRouteEligible("/about")).toBe(true);
      expect(isAdsterraRouteEligible("/news")).toBe(true);
      expect(isAdsterraRouteEligible("/news/some-slug")).toBe(true);
      expect(isAdsterraRouteEligible("/videouri")).toBe(true);
      expect(isAdsterraRouteEligible("/videouri/abc123")).toBe(true);
      expect(isAdsterraRouteEligible("/citire-personalizata")).toBe(true);
      expect(isAdsterraRouteEligible("/numar-norocos")).toBe(true);
      expect(isAdsterraRouteEligible("/cartea-ta")).toBe(true);
    });

    it("blocks subscription and admin routes", () => {
      expect(isAdsterraRouteEligible("/abonament")).toBe(false);
      expect(isAdsterraRouteEligible("/meeting")).toBe(false);
      expect(isAdsterraRouteEligible("/settings")).toBe(false);
      expect(isAdsterraRouteEligible("/dashboard/ads-orchestration")).toBe(false);
      expect(isAdsterraRouteEligible("/courses/xyz")).toBe(false);
    });
  });

  describe("isAdsenseRouteEligible", () => {
    it("only matches news and videouri", () => {
      expect(isAdsenseRouteEligible("/news")).toBe(true);
      expect(isAdsenseRouteEligible("/videouri/id")).toBe(true);
      expect(isAdsenseRouteEligible("/")).toBe(false);
    });
  });

  describe("getAdsterraPlacementKey", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("falls back to default key", () => {
      process.env.NEXT_PUBLIC_ADSTERRA_KEY_DEFAULT = "default-key";
      process.env.NEXT_PUBLIC_ADSTERRA_KEY_ARTICLE = "";
      expect(getAdsterraPlacementKey("article")).toBe("default-key");
    });

    it("uses placement-specific key when set", () => {
      process.env.NEXT_PUBLIC_ADSTERRA_KEY_DEFAULT = "default-key";
      process.env.NEXT_PUBLIC_ADSTERRA_KEY_VIDEO = "video-key";
      expect(getAdsterraPlacementKey("video")).toBe("video-key");
    });
  });
});
