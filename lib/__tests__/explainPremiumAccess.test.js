import { explainPremiumAccess } from "../explainPremiumAccess";

describe("explainPremiumAccess", () => {
  it("grants manual unlimited access", () => {
    const result = explainPremiumAccess({
      premium: true,
      subscriptionProvider: "manual",
      subscriptionStatus: "active",
    });
    expect(result.hasAccess).toBe(true);
    expect(result.reason).toBe("manual_active:manual");
  });

  it("denies expired manual access", () => {
    const result = explainPremiumAccess({
      premium: true,
      subscriptionProvider: "manual",
      manualPremiumExpiresAt: new Date(Date.now() - 60_000),
    });
    expect(result.hasAccess).toBe(false);
    expect(result.reason).toBe("manual_expired");
  });

  it("grants stripe active until period end", () => {
    const result = explainPremiumAccess({
      subscriptionProvider: "stripe",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
    });
    expect(result.hasAccess).toBe(true);
    expect(result.reason).toBe("stripe_active");
  });

  it("denies stripe canceled after grace", () => {
    const result = explainPremiumAccess({
      subscriptionProvider: "stripe",
      subscriptionStatus: "canceled",
      currentPeriodEnd: new Date(Date.now() - 60_000),
    });
    expect(result.hasAccess).toBe(false);
    expect(result.reason).toBe("stripe_canceled_expired");
  });
});
