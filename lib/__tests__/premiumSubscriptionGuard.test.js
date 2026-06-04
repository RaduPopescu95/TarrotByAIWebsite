import {
  PREMIUM_ALREADY_ACTIVE_ERROR,
  evaluatePremiumSubscriptionBlock,
  isSitePremiumStripeSubscription,
} from "../premiumSubscriptionGuard";

describe("premiumSubscriptionGuard", () => {
  describe("isSitePremiumStripeSubscription", () => {
    it("matches site_premium flow metadata", () => {
      expect(isSitePremiumStripeSubscription({ metadata: { flow: "site_premium" } })).toBe(true);
      expect(isSitePremiumStripeSubscription({ metadata: { flow: "other" } })).toBe(false);
    });
  });

  describe("evaluatePremiumSubscriptionBlock", () => {
    it("blocks when Firestore user already has premium access", () => {
      const result = evaluatePremiumSubscriptionBlock({
        userData: {
          premium: true,
          subscriptionStatus: "active",
          subscriptionProvider: "stripe",
          currentPeriodEnd: new Date(Date.now() + 86400000),
        },
        stripeSubscriptions: [],
      });
      expect(result).toEqual({ block: true, reason: "firestore_premium" });
    });

    it("blocks when Stripe has active site_premium subscription even if Firestore lags", () => {
      const result = evaluatePremiumSubscriptionBlock({
        userData: { premium: false, subscriptionStatus: "expired" },
        stripeSubscriptions: [
          {
            id: "sub_1",
            status: "active",
            metadata: { flow: "site_premium", uid: "u1" },
          },
        ],
      });
      expect(result).toEqual({ block: true, reason: "stripe_active_subscription" });
    });

    it("allows when no premium access and no guarded Stripe subscriptions", () => {
      const result = evaluatePremiumSubscriptionBlock({
        userData: { premium: false },
        stripeSubscriptions: [
          {
            id: "sub_other",
            status: "active",
            metadata: { flow: "courses" },
          },
          {
            id: "sub_inc",
            status: "incomplete",
            metadata: { flow: "site_premium" },
          },
        ],
      });
      expect(result).toEqual({ block: false });
    });

    it("blocks manual premium while active", () => {
      const result = evaluatePremiumSubscriptionBlock({
        userData: {
          premium: true,
          subscriptionProvider: "manual",
          subscriptionStatus: "active",
        },
        stripeSubscriptions: [],
      });
      expect(result).toEqual({ block: true, reason: "firestore_premium" });
    });
  });

  it("exports stable error code for API responses", () => {
    expect(PREMIUM_ALREADY_ACTIVE_ERROR).toBe("premium_already_active");
  });
});
