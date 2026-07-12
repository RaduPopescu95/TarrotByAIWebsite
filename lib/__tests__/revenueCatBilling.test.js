import {
  getRevenueCatEvent,
  findRevenueCatNonSubscriptionPurchase,
  isAuthorizedRevenueCatWebhook,
  processRevenueCatEvent,
  resolveRevenueCatProduct,
} from "../revenueCatBilling";

function buildMemoryDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  const makeRef = (path) => ({
    path,
    collection: (name) => makeCollection(`${path}/${name}`),
  });
  const makeCollection = (path) => ({
    doc: (id) => makeRef(`${path}/${id}`),
  });
  const db = {
    store,
    collection: (name) => makeCollection(name),
    runTransaction: async (callback) =>
      callback({
        get: async (ref) => ({
          exists: store.has(ref.path),
          data: () => store.get(ref.path),
        }),
        set: (ref, payload, options) => {
          const current = options?.merge ? store.get(ref.path) || {} : {};
          store.set(ref.path, { ...current, ...payload });
        },
      }),
  };
  return db;
}

describe("revenueCatBilling", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "false";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "stripe";
    process.env.ANDROID_BILLING_COURSES_ENABLED = "false";
    process.env.ANDROID_BILLING_COURSES_PROVIDER = "stripe";
    process.env.ANDROID_BILLING_ANALYSES_ENABLED = "false";
    process.env.ANDROID_BILLING_ANALYSES_PROVIDER = "stripe";
    delete process.env.REVENUECAT_COURSE_PRODUCT_MAP;
    delete process.env.REVENUECAT_BUNDLE_PRODUCT_MAP;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("authenticates exact bearer webhook tokens", () => {
    expect(isAuthorizedRevenueCatWebhook("Bearer webhook-secret", "webhook-secret")).toBe(
      true
    );
    expect(isAuthorizedRevenueCatWebhook("Bearer wrong", "webhook-secret")).toBe(false);
    expect(isAuthorizedRevenueCatWebhook("", "webhook-secret")).toBe(false);
  });

  it("extracts the nested RevenueCat event", () => {
    expect(
      getRevenueCatEvent({ event: { id: "evt-1", type: "INITIAL_PURCHASE" } })
    ).toEqual({ id: "evt-1", type: "INITIAL_PURCHASE" });
    expect(getRevenueCatEvent({ event: { type: "INITIAL_PURCHASE" } })).toBeNull();
  });

  it("maps premium and analysis products from server configuration", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "revenuecat";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    process.env.ANDROID_BILLING_ANALYSES_ENABLED = "true";
    process.env.ANDROID_BILLING_ANALYSES_PROVIDER = "revenuecat";
    process.env.REVENUECAT_ANALYSIS_PRODUCT_PERSONAL = "analysis_personal";
    const db = { collection: jest.fn() };

    await expect(resolveRevenueCatProduct(db, "premium_monthly:monthly")).resolves.toEqual({
      kind: "premium",
      productId: "premium_monthly",
    });
    await expect(resolveRevenueCatProduct(db, "analysis_personal")).resolves.toEqual({
      kind: "analysis",
      productId: "analysis_personal",
      analysisKey: "personal",
      productCode: "astrogama_natala",
      analysisType: "personalAstrograma",
    });
    expect(db.collection).not.toHaveBeenCalled();
  });

  it("ignores legacy course mappings while RevenueCat courses are disabled", async () => {
    process.env.ANDROID_BILLING_COURSES_ENABLED = "true";
    process.env.ANDROID_BILLING_COURSES_PROVIDER = "revenuecat";
    process.env.REVENUECAT_COURSE_PRODUCT_MAP = JSON.stringify({
      course_android_1: "course-1",
    });
    const db = { collection: jest.fn() };

    await expect(resolveRevenueCatProduct(db, "course_android_1")).resolves.toBeNull();
    expect(db.collection).not.toHaveBeenCalled();
  });

  it("verifies a one-time transaction only under the requested product", () => {
    const subscriber = {
      non_subscriptions: {
        course_android_1: [
          { id: "gpa.123", purchase_date: "2026-07-11T12:00:00Z" },
        ],
      },
    };
    expect(
      findRevenueCatNonSubscriptionPurchase(
        subscriber,
        "course_android_1",
        "gpa.123"
      )
    ).toEqual(expect.objectContaining({ id: "gpa.123" }));
    expect(
      findRevenueCatNonSubscriptionPurchase(
        subscriber,
        "another_product",
        "gpa.123"
      )
    ).toBeNull();
  });

  it("applies premium events once and preserves active Stripe access", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "revenuecat";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    const db = buildMemoryDb({
      "Users/firebase-uid": {
        premium: true,
        subscriptionProvider: "stripe",
        subscriptionStatus: "active",
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      },
    });
    const event = {
      id: "evt-premium-1",
      type: "INITIAL_PURCHASE",
      app_user_id: "firebase-uid",
      product_id: "premium_monthly",
      transaction_id: "google-tx-1",
      expiration_at_ms: Date.now() + 86_400_000,
    };

    await expect(processRevenueCatEvent(db, event)).resolves.toEqual(
      expect.objectContaining({ kind: "premium", entitlementGranted: true })
    );
    expect(db.store.get("Users/firebase-uid")).toEqual(
      expect.objectContaining({
        premium: true,
        subscriptionProvider: "multiple",
        activePremiumProviders: ["revenuecat", "stripe"],
      })
    );
    await expect(processRevenueCatEvent(db, event)).resolves.toEqual({
      skipped: true,
      reason: "already_processed",
    });
  });
});
