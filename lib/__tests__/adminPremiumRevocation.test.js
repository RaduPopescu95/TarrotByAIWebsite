import { resolveAdminPremiumRevocation } from "../adminPremiumRevocation";

describe("admin premium revocation routing", () => {
  it("selects Stripe on a mixed account and preserves RevenueCat", () => {
    expect(
      resolveAdminPremiumRevocation({
        subscriptionProvider: "multiple",
        stripeSubscriptionId: "sub_123",
        premiumSources: {
          stripe: { active: true },
          revenuecat: { active: true },
        },
      })
    ).toEqual({
      source: "stripe",
      subscriptionId: "sub_123",
      hasActiveRevenueCat: true,
    });
  });

  it("routes a manual-only account to manual removal", () => {
    expect(
      resolveAdminPremiumRevocation({
        subscriptionProvider: "manual",
        premium: true,
      }).source
    ).toBe("manual");
  });

  it("refuses to revoke an active Play entitlement locally", () => {
    expect(
      resolveAdminPremiumRevocation({
        premiumSources: { revenuecat: { active: true } },
      }).error
    ).toBe("revenuecat_managed_externally");
  });
});
