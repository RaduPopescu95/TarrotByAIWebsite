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
  "IOS_BILLING_PREMIUM_ENABLED",
  "IOS_BILLING_ANALYSES_ENABLED",
  "REVENUECAT_PREMIUM_PRODUCT_ID",
  "REVENUECAT_ANALYSIS_PRODUCT_PERSONAL",
  "REVENUECAT_IOS_PREMIUM_PRODUCT_ID",
  "REVENUECAT_IOS_ANALYSIS_PRODUCT_PERSONAL",
  "REVENUECAT_IOS_ANALYSIS_PRODUCT_ASTROGRAMA_OTHERS",
  "REVENUECAT_IOS_ANALYSIS_PRODUCT_SINASTRIE_ONE_PERSON",
  "REVENUECAT_IOS_ANALYSIS_PRODUCT_SINASTRIE_OTHERS",
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

  it("keeps Android premium pinned to RevenueCat even when configuration is missing", () => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
    const config = getBillingConfig();
    expect(config.android.premium).toEqual(
      expect.objectContaining({ enabled: false, provider: "revenuecat", productId: null })
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

  it("does not allow the remote setting to route Android premium back to Stripe", () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "revenuecat";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";

    expect(getPublicBillingConfig({}).providers.premium).toBe("revenuecat");
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

  it("exposes iOS products separately and fails closed without rollout", () => {
    process.env.IOS_BILLING_PREMIUM_ENABLED = "true";
    process.env.IOS_BILLING_ANALYSES_ENABLED = "true";
    process.env.REVENUECAT_IOS_PREMIUM_PRODUCT_ID = "premium_monthly";
    process.env.REVENUECAT_IOS_ANALYSIS_PRODUCT_PERSONAL =
      "analysis_astrogama_natala";

    const disabled = getPublicBillingConfig({});
    expect(disabled.platforms.ios).toEqual(
      expect.objectContaining({
        providers: expect.objectContaining({
          premium: "revenuecat",
          analyses: "revenuecat",
        }),
        availability: expect.objectContaining({ premium: false, analyses: false }),
      })
    );

    const incomplete = getPublicBillingConfig({
      iosBillingPremiumProvider: "revenuecat",
      iosBillingAnalysesProvider: "revenuecat",
    });
    expect(incomplete.platforms.ios.availability.analyses).toBe(false);

    process.env.REVENUECAT_IOS_ANALYSIS_PRODUCT_ASTROGRAMA_OTHERS =
      "analysis_astrogama_natala_other_person";
    process.env.REVENUECAT_IOS_ANALYSIS_PRODUCT_SINASTRIE_ONE_PERSON =
      "analysis_sinastrie_relatie";
    process.env.REVENUECAT_IOS_ANALYSIS_PRODUCT_SINASTRIE_OTHERS =
      "analysis_sinastrie_relatie_others";
    const enabled = getPublicBillingConfig({
      iosBillingPremiumProvider: "revenuecat",
      iosBillingAnalysesProvider: "revenuecat",
    });
    expect(enabled.platforms.ios.availability).toEqual(
      expect.objectContaining({ premium: true, analyses: true })
    );
    expect(enabled.platforms.ios.revenueCat).toEqual({
      premiumProductId: "premium_monthly",
      analysisProductIds: {
        astrogama_natala: "analysis_astrogama_natala",
        astrogama_natala_other_person: "analysis_astrogama_natala_other_person",
        sinastrie_relatie: "analysis_sinastrie_relatie",
        sinastrie_relatie_others: "analysis_sinastrie_relatie_others",
      },
    });
  });
});
