import { hasPremiumAccess } from "../premiumAccess";
import { buildPremiumSourcePatch } from "../premiumSources";

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
});
