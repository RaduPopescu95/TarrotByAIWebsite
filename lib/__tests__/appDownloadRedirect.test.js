import {
  detectAppStorePlatform,
  getAppStoreUrl,
} from "../appDownloadRedirect";
import {
  APPLE_APP_STORE_URL,
  GOOGLE_PLAY_APP_URL,
} from "../appStoreLinks";

describe("app download device detection", () => {
  test.each([
    [
      "Android Chrome",
      {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36",
      },
    ],
    [
      "Android User-Agent Client Hints",
      {
        userAgent: "Mozilla/5.0 AppleWebKit/537.36 Chrome/126 Mobile",
        userAgentData: { platform: "Android" },
      },
    ],
  ])("detects %s", (_label, navigatorLike) => {
    expect(detectAppStorePlatform(navigatorLike)).toBe("android");
  });

  test.each([
    [
      "iPhone",
      {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        platform: "iPhone",
        maxTouchPoints: 5,
      },
    ],
    [
      "iPad",
      {
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        platform: "iPad",
        maxTouchPoints: 5,
      },
    ],
    [
      "iPadOS desktop User-Agent",
      {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      },
    ],
  ])("detects %s", (_label, navigatorLike) => {
    expect(detectAppStorePlatform(navigatorLike)).toBe("ios");
  });

  test.each([
    [
      "Mac desktop",
      {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0,
      },
    ],
    [
      "Windows desktop",
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        platform: "Win32",
      },
    ],
    ["unknown device", { userAgent: "CustomInAppBrowser/1.0" }],
  ])("does not guess for %s", (_label, navigatorLike) => {
    expect(detectAppStorePlatform(navigatorLike)).toBeNull();
  });

  it("maps detected platforms to the canonical store URLs", () => {
    expect(getAppStoreUrl("android")).toBe(GOOGLE_PLAY_APP_URL);
    expect(getAppStoreUrl("ios")).toBe(APPLE_APP_STORE_URL);
    expect(GOOGLE_PLAY_APP_URL).toBe(
      "https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot"
    );
    expect(APPLE_APP_STORE_URL).toBe(
      "https://apps.apple.com/ro/app/cristina-zurba-tarot/id6475713937"
    );
  });
});
