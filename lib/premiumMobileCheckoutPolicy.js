import { normalizeAppPlatform } from "./appPlatform";

export function resolvePremiumMobileCheckoutPolicy(
  requestedPlatform,
  iosPremiumSubscriptionsEnabled
) {
  const platform = normalizeAppPlatform(requestedPlatform);
  if (platform === "android") {
    return { allowed: false, platform, error: "android_premium_google_play_only" };
  }
  if (!iosPremiumSubscriptionsEnabled) {
    return {
      allowed: false,
      platform,
      error: "ios_premium_subscriptions_disabled",
      premiumAccessFree: true,
    };
  }
  return { allowed: true, platform };
}
