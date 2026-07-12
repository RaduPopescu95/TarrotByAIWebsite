import {
  getBillingConfig,
  getPublicBillingConfig,
  normalizeRevenueCatProductId,
} from "../billingConfig";

const ENV_KEYS = [
  "ANDROID_BILLING_PREMIUM_ENABLED",
  "ANDROID_BILLING_PREMIUM_PROVIDER",
  "ANDROID_BILLING_COURSES_ENABLED",
  "ANDROID_BILLING_COURSES_PROVIDER",
  "ANDROID_BILLING_ANALYSES_ENABLED",
  "ANDROID_BILLING_ANALYSES_PROVIDER",
  "REVENUECAT_PREMIUM_PRODUCT_ID",
  "REVENUECAT_ANALYSIS_PRODUCT_PERSONAL",
];

describe("billingConfig", () => {
  const original = {};

  beforeAll(() => {
    ENV_KEYS.forEach((key) => {
      original[key] = process.env[key];
    });
  });

  afterEach(() => {
    ENV_KEYS.forEach((key) => {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    });
  });

  it("defaults every Android flow to disabled Stripe", () => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
    const config = getBillingConfig();
    expect(config.android.premium).toEqual(
      expect.objectContaining({ enabled: false, provider: "stripe", productId: null })
    );
    expect(config.android.courses).toEqual({ enabled: false, provider: "stripe" });
    expect(config.android.analyses).toEqual(
      expect.objectContaining({ enabled: false, provider: "stripe" })
    );
  });

  it("only selects RevenueCat when a flow is explicitly enabled", () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "revenuecat";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    const config = getBillingConfig();
    expect(config.android.premium).toEqual(
      expect.objectContaining({
        enabled: true,
        provider: "revenuecat",
        productId: "premium_monthly",
      })
    );
  });

  it("keeps courses on Stripe even when legacy RevenueCat flags are present", () => {
    process.env.ANDROID_BILLING_COURSES_ENABLED = "true";
    process.env.ANDROID_BILLING_COURSES_PROVIDER = "revenuecat";

    expect(getBillingConfig().android.courses).toEqual({
      enabled: false,
      provider: "stripe",
    });
    expect(
      getPublicBillingConfig({
        androidBillingCoursesProvider: "revenuecat",
      }).providers.courses
    ).toBe("stripe");
  });

  it("normalizes Play base-plan product identifiers", () => {
    expect(normalizeRevenueCatProductId("premium_monthly:base-plan")).toBe(
      "premium_monthly"
    );
  });

  it("requires both deployed integration and remote rollout setting", () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "revenuecat";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";

    expect(getPublicBillingConfig({}).providers.premium).toBe("stripe");
    expect(
      getPublicBillingConfig({
        androidBillingPremiumProvider: "revenuecat",
      })
    ).toEqual(
      expect.objectContaining({
        providers: expect.objectContaining({ premium: "revenuecat" }),
        revenueCat: expect.objectContaining({
          premiumProductId: "premium_monthly",
        }),
      })
    );
  });
});
