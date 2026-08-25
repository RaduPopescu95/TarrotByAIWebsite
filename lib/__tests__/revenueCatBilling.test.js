import {
  bindVerifiedAnalysisPurchase,
  getRevenueCatEvent,
  findRevenueCatNonSubscriptionPurchase,
  isAuthorizedRevenueCatWebhook,
  processRevenueCatEvent,
  revenueCatPurchaseMatchesPlatform,
  reconcileRevenueCatPremium,
  resolveRevenueCatSubscriberPremiumState,
  resolveRevenueCatProduct,
  syncRevenueCatPremiumFromSubscriber,
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
    process.env.IOS_BILLING_PREMIUM_ENABLED = "false";
    process.env.IOS_BILLING_ANALYSES_ENABLED = "false";
    delete process.env.REVENUECAT_IOS_PREMIUM_PRODUCT_ID;
    delete process.env.REVENUECAT_IOS_ANALYSIS_PRODUCT_PERSONAL;
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
      platform: "android",
    });
    await expect(resolveRevenueCatProduct(db, "analysis_personal")).resolves.toEqual({
      kind: "analysis",
      productId: "analysis_personal",
      analysisKey: "personal",
      platform: "android",
      productCode: "astrogama_natala",
      analysisType: "personalAstrograma",
    });
    expect(db.collection).not.toHaveBeenCalled();
  });

  it("maps and records App Store premium events with their native store", async () => {
    process.env.IOS_BILLING_PREMIUM_ENABLED = "true";
    process.env.REVENUECAT_IOS_PREMIUM_PRODUCT_ID = "premium_monthly";
    const db = buildMemoryDb({ "Users/firebase-uid": { premium: false } });

    const result = await processRevenueCatEvent(db, {
      id: "evt-apple-premium",
      type: "INITIAL_PURCHASE",
      app_user_id: "firebase-uid",
      product_id: "premium_monthly",
      transaction_id: "apple-tx-1",
      original_transaction_id: "apple-original-1",
      store: "APP_STORE",
      environment: "SANDBOX",
      expiration_at_ms: Date.now() + 86_400_000,
    });

    expect(result).toEqual(
      expect.objectContaining({ kind: "premium", entitlementGranted: true })
    );
    expect(db.store.get("Users/firebase-uid")).toEqual(
      expect.objectContaining({
        premium: true,
        revenueCatStore: "APP_STORE",
        revenueCatEnvironment: "SANDBOX",
      })
    );
    expect(
      db.store.get("Users/firebase-uid").premiumSources.revenuecat.store
    ).toBe("APP_STORE");
  });

  it.each([
    ["RENEWAL", true, false],
    ["CANCELLATION", true, true],
    ["EXPIRATION", false, false],
    ["REFUND", false, false],
  ])("normalizes App Store %s premium lifecycle events", async (type, active, cancelAtPeriodEnd) => {
    process.env.IOS_BILLING_PREMIUM_ENABLED = "true";
    process.env.REVENUECAT_IOS_PREMIUM_PRODUCT_ID = "premium_monthly";
    const uid = `apple-${String(type).toLowerCase()}`;
    const db = buildMemoryDb({ [`Users/${uid}`]: { premium: false } });

    await processRevenueCatEvent(db, {
      id: `evt-apple-${String(type).toLowerCase()}`,
      type,
      app_user_id: uid,
      product_id: "premium_monthly",
      store: "APP_STORE",
      environment: "SANDBOX",
      event_timestamp_ms: Date.now(),
      expiration_at_ms: Date.now() + 86_400_000,
    });

    expect(db.store.get(`Users/${uid}`).premiumSources.revenuecat).toEqual(
      expect.objectContaining({ active, cancelAtPeriodEnd, store: "APP_STORE" })
    );
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

  it("requires the verified one-time purchase store to match the client platform", () => {
    expect(revenueCatPurchaseMatchesPlatform({ store: "APP_STORE" }, "ios")).toBe(true);
    expect(revenueCatPurchaseMatchesPlatform({ store: "PLAY_STORE" }, "android")).toBe(true);
    expect(revenueCatPurchaseMatchesPlatform({ store: "PLAY_STORE" }, "ios")).toBe(false);
    expect(revenueCatPurchaseMatchesPlatform({}, "ios")).toBe(false);
    expect(revenueCatPurchaseMatchesPlatform({}, null)).toBe(true);
  });

  it("binds each App Store consumable transaction once while allowing a repeat product purchase", async () => {
    process.env.IOS_BILLING_ANALYSES_ENABLED = "true";
    process.env.REVENUECAT_IOS_ANALYSIS_PRODUCT_PERSONAL = "analysis_personal";
    process.env.REVENUECAT_SECRET_API_KEY = "secret";
    const db = buildMemoryDb({ "Users/firebase-uid": {} });
    const purchases = ["apple-tx-1", "apple-tx-2"].map((id) => ({
      id,
      store: "APP_STORE",
      purchase_date: "2026-08-22T12:00:00Z",
      is_sandbox: true,
    }));
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        subscriber: { non_subscriptions: { analysis_personal: purchases } },
      }),
    });
    const confirm = (analysisId, transactionId) =>
      bindVerifiedAnalysisPurchase({
        db,
        uid: "firebase-uid",
        analysisId,
        productCode: "astrogama_natala",
        productId: "analysis_personal",
        transactionId,
        platform: "ios",
        fetchImpl,
      });

    await expect(confirm("analysis-a", "apple-tx-1")).resolves.toEqual(
      expect.objectContaining({ confirmed: true, transactionId: "apple-tx-1" })
    );
    await expect(confirm("analysis-b", "apple-tx-1")).rejects.toMatchObject({
      statusCode: 409,
    });
    await expect(confirm("analysis-b", "apple-tx-2")).resolves.toEqual(
      expect.objectContaining({ confirmed: true, transactionId: "apple-tx-2" })
    );
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

  it("records but does not apply an older RevenueCat revision", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    const db = buildMemoryDb({
      "Users/firebase-uid": {
        premium: true,
        premiumSources: {
          revenuecat: { active: true, eventTimestampMs: 2_000 },
        },
      },
    });
    const result = await processRevenueCatEvent(db, {
      id: "evt-stale",
      type: "EXPIRATION",
      event_timestamp_ms: 1_000,
      app_user_id: "firebase-uid",
      product_id: "premium_monthly",
    });
    expect(result).toEqual({ skipped: true, reason: "stale_event", kind: "premium" });
    expect(db.store.get("Users/firebase-uid").premiumSources.revenuecat.active).toBe(true);
    expect(db.store.has("revenueCatWebhookEvents/evt-stale")).toBe(true);
  });

  it("does not create Google Play history for an empty RevenueCat subscriber", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    const db = buildMemoryDb({ "Users/firebase-uid": { premium: false } });

    await expect(
      syncRevenueCatPremiumFromSubscriber(db, "firebase-uid", {
        entitlements: {},
        subscriptions: {},
      })
    ).resolves.toEqual(
      expect.objectContaining({
        active: false,
        status: "no_purchase",
        hasPurchaseHistory: false,
        wrote: false,
      })
    );
    expect(db.store.get("Users/firebase-uid").premiumSources).toBeUndefined();
  });

  it("does not preserve an already expired local paid period during an empty sync", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    const db = buildMemoryDb({
      "Users/firebase-uid": {
        premium: true,
        premiumSources: {
          revenuecat: {
            active: true,
            productId: "premium_monthly",
            expiresAt: new Date(Date.now() - 60_000),
          },
        },
      },
    });

    await expect(
      syncRevenueCatPremiumFromSubscriber(db, "firebase-uid", {
        entitlements: {},
        subscriptions: {},
      })
    ).resolves.toEqual(
      expect.objectContaining({ active: false, status: "expired", pending: false })
    );
    expect(db.store.get("Users/firebase-uid")).toEqual(
      expect.objectContaining({ premium: false, subscriptionProvider: null })
    );
  });

  it("allows a delayed purchase webhook after an initially empty REST sync", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.ANDROID_BILLING_PREMIUM_PROVIDER = "revenuecat";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    const db = buildMemoryDb({ "Users/firebase-uid": { premium: false } });

    await syncRevenueCatPremiumFromSubscriber(db, "firebase-uid", {
      entitlements: {},
      subscriptions: {},
    });
    const purchaseEventTimestamp = Date.now() - 10_000;
    const result = await processRevenueCatEvent(db, {
      id: "evt-delayed-purchase",
      type: "INITIAL_PURCHASE",
      event_timestamp_ms: purchaseEventTimestamp,
      app_user_id: "firebase-uid",
      product_id: "premium_monthly",
      original_transaction_id: "google-original-1",
      expiration_at_ms: Date.now() + 86_400_000,
    });

    expect(result).toEqual(
      expect.objectContaining({ kind: "premium", entitlementGranted: true })
    );
    expect(db.store.get("Users/firebase-uid")).toEqual(
      expect.objectContaining({ premium: true, subscriptionProvider: "revenuecat" })
    );
  });

  it("classifies an active canceled subscription as cancel-at-period-end", () => {
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly:monthly-autorenewing";
    const state = resolveRevenueCatSubscriberPremiumState({
      entitlements: {
        premium: {
          product_identifier: "premium_monthly",
          expires_date: new Date(Date.now() + 86_400_000).toISOString(),
        },
      },
      subscriptions: {
        premium_monthly: {
          expires_date: new Date(Date.now() + 86_400_000).toISOString(),
          unsubscribe_detected_at: new Date().toISOString(),
        },
      },
    });
    expect(state).toEqual(
      expect.objectContaining({
        active: true,
        status: "active",
        cancelAtPeriodEnd: true,
        productId: "premium_monthly",
      })
    );
  });

  it("retries an empty subscriber snapshot until premium becomes active", async () => {
    process.env.ANDROID_BILLING_PREMIUM_ENABLED = "true";
    process.env.REVENUECAT_PREMIUM_PRODUCT_ID = "premium_monthly";
    process.env.REVENUECAT_SECRET_API_KEY = "secret";
    const db = buildMemoryDb({ "Users/firebase-uid": { premium: false } });
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscriber: { entitlements: {}, subscriptions: {} } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscriber: {
            entitlements: {
              premium: { product_identifier: "premium_monthly", expires_date: future },
            },
            subscriptions: { premium_monthly: { expires_date: future } },
          },
        }),
      });
    const waitImpl = jest.fn().mockResolvedValue(undefined);

    const result = await reconcileRevenueCatPremium(db, "firebase-uid", {
      fetchImpl,
      maxAttempts: 3,
      waitImpl,
    });

    expect(result).toEqual(expect.objectContaining({ active: true, attempts: 2 }));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waitImpl).toHaveBeenCalledTimes(1);
  });
});
