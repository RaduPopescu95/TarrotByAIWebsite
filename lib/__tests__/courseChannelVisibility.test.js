import {
  hasAtLeastOneCourseChannel,
  isCourseAvailableOnChannel,
  isCourseVisibleOnChannel,
  resolveCourseChannelFromPlatform,
  resolveCourseRequestChannel,
} from "../courses";

describe("course channel visibility", () => {
  test("legacy courses without channel fields remain available everywhere", () => {
    const course = { status: "published" };
    expect(isCourseAvailableOnChannel(course, "website")).toBe(true);
    expect(isCourseAvailableOnChannel(course, "mobile")).toBe(true);
  });

  test("filters website-only and mobile-only courses", () => {
    const websiteOnly = {
      status: "published",
      availableOnWebsite: true,
      availableOnMobile: false,
    };
    const mobileOnly = {
      status: "published",
      availableOnWebsite: false,
      availableOnMobile: true,
    };

    expect(isCourseVisibleOnChannel(websiteOnly, "website")).toBe(true);
    expect(isCourseVisibleOnChannel(websiteOnly, "mobile")).toBe(false);
    expect(isCourseVisibleOnChannel(mobileOnly, "website")).toBe(false);
    expect(isCourseVisibleOnChannel(mobileOnly, "mobile")).toBe(true);
  });

  test("combines scheduled publication time with channel visibility", () => {
    const scheduled = {
      status: "scheduled",
      scheduledAt: "2026-01-01T00:00:00.000Z",
      availableOnWebsite: true,
      availableOnMobile: false,
    };

    expect(isCourseVisibleOnChannel(scheduled, "website", Date.parse("2026-01-02"))).toBe(true);
    expect(isCourseVisibleOnChannel(scheduled, "mobile", Date.parse("2026-01-02"))).toBe(false);
    expect(isCourseVisibleOnChannel(scheduled, "website", Date.parse("2025-12-31"))).toBe(false);
  });

  test("treats unmarked legacy requests as mobile and explicit website requests as website", () => {
    expect(resolveCourseRequestChannel({ query: {}, headers: {} })).toBe("mobile");
    expect(
      resolveCourseRequestChannel({ query: { channel: "website" }, headers: {} })
    ).toBe("website");
    expect(
      resolveCourseRequestChannel({
        query: {},
        headers: { "x-app-client": "expo-mobile", "x-app-platform": "ios" },
      })
    ).toBe("mobile");
  });

  test("maps checkout platforms to the matching course channel", () => {
    expect(resolveCourseChannelFromPlatform("expo")).toBe("mobile");
    expect(resolveCourseChannelFromPlatform("react-native")).toBe("mobile");
    expect(resolveCourseChannelFromPlatform("web")).toBe("website");
    expect(resolveCourseChannelFromPlatform(undefined)).toBe("website");
  });

  test("detects when no channel is selected", () => {
    expect(hasAtLeastOneCourseChannel({})).toBe(true);
    expect(
      hasAtLeastOneCourseChannel({ availableOnWebsite: false, availableOnMobile: false })
    ).toBe(false);
  });
});
