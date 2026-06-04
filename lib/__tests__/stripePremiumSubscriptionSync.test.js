import { isManualPremiumProtected } from "../premiumAccess";

const SITE_PREMIUM_SUB = {
  id: "sub_test_1",
  status: "canceled",
  metadata: { flow: "site_premium", uid: "user_manual_1" },
  customer: "cus_123",
  cancel_at_period_end: false,
};

const buildDb = (userData) => {
  const setCalls = [];
  const db = {
    setCalls,
    collection: jest.fn(() => ({
      doc: jest.fn((id) => ({
        get: jest.fn(async () => ({
          exists: Boolean(userData),
          id,
          data: () => userData,
        })),
        set: jest.fn(async (payload, options) => {
          setCalls.push({ id, payload, options });
        }),
      })),
    })),
  };
  return db;
};

const loadSyncModule = async (userData) => {
  jest.resetModules();
  const db = buildDb(userData);
  jest.doMock("../firebaseAdmin", () => ({
    getAdminDb: () => db,
  }));
  const mod = await import("../stripePremiumSubscriptionSync");
  return { mod, db };
};

describe("isManualPremiumProtected", () => {
  it("returns true for active unlimited manual premium", () => {
    expect(
      isManualPremiumProtected({
        premium: true,
        subscriptionProvider: "manual",
        subscriptionStatus: "active",
      })
    ).toBe(true);
  });

  it("returns false when manual premium has expired", () => {
    expect(
      isManualPremiumProtected({
        premium: true,
        subscriptionProvider: "manual",
        subscriptionStatus: "active",
        manualPremiumExpiresAt: new Date(Date.now() - 86400000),
      })
    ).toBe(false);
  });

  it("returns false for stripe provider", () => {
    expect(
      isManualPremiumProtected({
        premium: true,
        subscriptionProvider: "stripe",
        subscriptionStatus: "active",
        currentPeriodEnd: new Date(Date.now() + 86400000),
      })
    ).toBe(false);
  });
});

describe("syncPremiumSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips Firestore write when manual premium is active", async () => {
    const { mod, db } = await loadSyncModule({
      premium: true,
      subscriptionProvider: "manual",
      subscriptionStatus: "active",
    });

    const result = await mod.syncPremiumSubscription(SITE_PREMIUM_SUB);

    expect(result).toEqual({
      skipped: true,
      reason: "manual_premium_active",
      uid: "user_manual_1",
    });
    expect(db.setCalls).toHaveLength(0);
  });

  it("writes stripe payload when user has no manual protection", async () => {
    const { mod, db } = await loadSyncModule({
      premium: false,
      subscriptionStatus: "expired",
    });

    const result = await mod.syncPremiumSubscription(SITE_PREMIUM_SUB);

    expect(result.skipped).toBe(false);
    expect(result.uid).toBe("user_manual_1");
    expect(db.setCalls).toHaveLength(1);
    expect(db.setCalls[0].payload.subscriptionProvider).toBe("stripe");
    expect(db.setCalls[0].payload.stripeSubscriptionId).toBe("sub_test_1");
  });

  it("writes stripe payload when manual premium has expired", async () => {
    const { mod, db } = await loadSyncModule({
      premium: true,
      subscriptionProvider: "manual",
      subscriptionStatus: "active",
      manualPremiumExpiresAt: new Date(Date.now() - 3600000),
    });

    const result = await mod.syncPremiumSubscription({
      ...SITE_PREMIUM_SUB,
      status: "active",
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    });

    expect(result.skipped).toBe(false);
    expect(db.setCalls).toHaveLength(1);
    expect(db.setCalls[0].payload.subscriptionProvider).toBe("stripe");
  });

  it("skips non site_premium flow without reading user", async () => {
    const { mod, db } = await loadSyncModule({
      premium: true,
      subscriptionProvider: "manual",
      subscriptionStatus: "active",
    });

    const result = await mod.syncPremiumSubscription({
      ...SITE_PREMIUM_SUB,
      metadata: { flow: "other", uid: "user_manual_1" },
    });

    expect(result).toEqual({ skipped: true, reason: "not_site_premium" });
    expect(db.setCalls).toHaveLength(0);
  });
});
