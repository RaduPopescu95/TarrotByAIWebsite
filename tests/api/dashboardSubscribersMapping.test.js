import { mapDocToSubscriber } from "../../pages/api/dashboard/subscribers";

function doc(id, data) {
  return { id, data: () => data };
}

describe("dashboard subscribers Google Play lifecycle", () => {
  it("excludes an empty expired RevenueCat placeholder", () => {
    expect(
      mapDocToSubscriber(
        doc("uid-empty", {
          premium: false,
          subscriptionProvider: "revenuecat",
          revenueCatSubscriptionStatus: "expired",
          premiumSources: {
            revenuecat: {
              active: false,
              status: "expired",
              productId: null,
              expiresAt: null,
            },
          },
        })
      )
    ).toBeNull();
  });

  it("shows canceled-at-period-end while preserving active access", () => {
    const expiresAt = new Date(Date.now() + 86_400_000);
    const row = mapDocToSubscriber(
      doc("uid-active", {
        premium: true,
        premiumSources: {
          revenuecat: {
            active: true,
            status: "active",
            productId: "premium_monthly",
            expiresAt,
            cancelAtPeriodEnd: true,
          },
        },
        revenueCatSubscriptionStatus: "active",
        revenueCatCurrentPeriodEnd: expiresAt,
        revenueCatProductId: "premium_monthly",
      })
    );
    expect(row).toEqual(
      expect.objectContaining({
        billingSource: "google_play",
        premium: true,
        subscriptionStatus: "cancel_at_period_end",
        cancelAtPeriodEnd: true,
      })
    );
  });
});
