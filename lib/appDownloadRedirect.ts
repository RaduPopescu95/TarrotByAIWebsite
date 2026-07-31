import {
  APPLE_APP_STORE_URL,
  GOOGLE_PLAY_APP_URL,
} from "./appStoreLinks";

export type AppStorePlatform = "android" | "ios";

export type DeviceNavigator = {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  userAgentData?: {
    platform?: string;
  };
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

export function detectAppStorePlatform(
  deviceNavigator: DeviceNavigator
): AppStorePlatform | null {
  const userAgent = normalize(deviceNavigator.userAgent);
  const platform = normalize(deviceNavigator.platform);
  const userAgentDataPlatform = normalize(
    deviceNavigator.userAgentData?.platform
  );
  const maxTouchPoints = deviceNavigator.maxTouchPoints ?? 0;

  if (
    userAgent.includes("android") ||
    userAgentDataPlatform === "android"
  ) {
    return "android";
  }

  const reportsIos =
    /iphone|ipad|ipod/.test(userAgent) ||
    /iphone|ipad|ipod|ios|ipados/.test(platform) ||
    /ios|ipados/.test(userAgentDataPlatform);

  const reportsDesktopIpad =
    maxTouchPoints > 1 &&
    (userAgent.includes("macintosh") || platform === "macintel");

  if (reportsIos || reportsDesktopIpad) {
    return "ios";
  }

  return null;
}

export function getAppStoreUrl(platform: AppStorePlatform): string {
  return platform === "android"
    ? GOOGLE_PLAY_APP_URL
    : APPLE_APP_STORE_URL;
}
