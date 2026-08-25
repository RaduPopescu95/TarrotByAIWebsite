import { normalizeAppPlatform } from "./appPlatform";

export function resolvePremiumMobileCheckoutPolicy(
  requestedPlatform,
  _iosPremiumSubscriptionsEnabled
) {
  const platform = normalizeAppPlatform(requestedPlatform);
  if (platform === "android") {
    return { allowed: false, platform, error: "android_premium_google_play_only" };
  }
  if (platform === "ios") {
    return {
      allowed: false,
      platform,
      error: "ios_premium_app_store_only",
    };
  }
  return { allowed: true, platform };
}
