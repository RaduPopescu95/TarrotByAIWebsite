import { hasPremiumAccess } from "../premiumAccess";
import {
  buildPremiumSourcePatch,
  getRevenueCatLifecycle,
  hasRevenueCatPurchaseEvidence,
} from "../premiumSources";

describe("premiumSources", () => {
  it("keeps premium active while either billing provider is active", () => {
    const patch = buildPremiumSourcePatch(
      {
        premium: true,
        subscriptionProvider: "stripe",
        subscriptionStatus: "active",
        currentPeriodEnd: new Date(Date.now() + 60_000),
      },
      "revenuecat",
      { active: false, status: "expired" }
    );

    expect(patch.premium).toBe(true);
    expect(patch.activePremiumProviders).toEqual(["stripe"]);
    expect(hasPremiumAccess(patch)).toBe(true);
  });

  it("reports multiple providers and prevents a duplicate subscription", () => {
    const patch = buildPremiumSourcePatch(
      {
        premiumSources: {
          stripe: { active: true, expiresAt: new Date(Date.now() + 60_000) },
        },
      },
      "revenuecat",
      { active: true, expiresAt: new Date(Date.now() + 60_000) }
    );

    expect(patch.subscriptionProvider).toBe("multiple");
    expect(patch.activePremiumProviders).toEqual(["revenuecat", "stripe"]);
    expect(hasPremiumAccess(patch)).toBe(true);
  });

  it("does not count expired source grants", () => {
    expect(
      hasPremiumAccess({
        premium: false,
        premiumSources: {
          revenuecat: { active: true, expiresAt: new Date(Date.now() - 60_000) },
        },
      })
    ).toBe(false);
  });

  it("treats a canonical empty source map as authoritative", () => {
    expect(
      hasPremiumAccess({
        premium: true,
        subscriptionProvider: "multiple",
        premiumSources: {},
      })
    ).toBe(false);
  });

  it("clears the aggregate provider when the last source becomes inactive", () => {
    const patch = buildPremiumSourcePatch(
      { premiumSources: { stripe: { active: true } } },
      "stripe",
      { active: false, status: "canceled" }
    );
    expect(patch).toEqual(
      expect.objectContaining({
        premium: false,
        activePremiumProviders: [],
        subscriptionProvider: null,
      })
    );
  });

  it("infers legacy Stripe and RevenueCat independently on mixed accounts", () => {
    expect(
      hasPremiumAccess({
        premium: true,
        subscriptionProvider: "multiple",
        stripeSubscriptionId: "sub_old",
        subscriptionStatus: "expired",
        revenueCatSubscriptionStatus: "active",
        revenueCatCurrentPeriodEnd: new Date(Date.now() + 60_000),
      })
    ).toBe(true);
  });

  it("does not treat an empty expired placeholder as Google Play history", () => {
    const profile = {
      premium: false,
      premiumSources: {
        revenuecat: { active: false, status: "expired", productId: null, expiresAt: null },
      },
      revenueCatSubscriptionStatus: "expired",
    };
    expect(hasRevenueCatPurchaseEvidence(profile)).toBe(false);
    expect(getRevenueCatLifecycle(profile)).toEqual(
      expect.objectContaining({ status: "no_purchase", hasPurchaseHistory: false })
    );
  });

  it("keeps canceled Google Play access active until the paid period ends", () => {
    const future = new Date(Date.now() + 60_000);
    const lifecycle = getRevenueCatLifecycle({
      premiumSources: {
        revenuecat: {
          active: true,
          productId: "premium_monthly",
          expiresAt: future,
          cancelAtPeriodEnd: true,
        },
      },
    });
    expect(lifecycle).toEqual(
      expect.objectContaining({
        status: "cancel_at_period_end",
        active: true,
        cancelAtPeriodEnd: true,
      })
    );
  });
});
