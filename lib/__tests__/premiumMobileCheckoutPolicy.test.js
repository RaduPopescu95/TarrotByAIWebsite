import { resolvePremiumMobileCheckoutPolicy } from "../premiumMobileCheckoutPolicy";

describe("premium mobile checkout policy", () => {
  it("always rejects Android Stripe premium checkout", () => {
    expect(resolvePremiumMobileCheckoutPolicy("android", true)).toEqual({
      allowed: false,
      platform: "android",
      error: "android_premium_google_play_only",
    });
  });

  it("rejects iOS Stripe checkout while iOS premium is free", () => {
    expect(resolvePremiumMobileCheckoutPolicy("ios", false)).toEqual({
      allowed: false,
      platform: "ios",
      error: "ios_premium_subscriptions_disabled",
      premiumAccessFree: true,
    });
  });

  it("keeps a legacy mobile iOS checkout compatible while enabled", () => {
    expect(resolvePremiumMobileCheckoutPolicy("expo", true)).toEqual({
      allowed: true,
      platform: null,
    });
  });
});
