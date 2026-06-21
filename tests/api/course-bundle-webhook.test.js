jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
  }));
});

import {
  processBundleCheckoutSessionEvent,
  resolvePurchaseContext,
} from "../../pages/api/stripe/courses/webhook";

function createRef(path) {
  return {
    path,
    collection(name) {
      return {
        doc(id) {
          return createRef(`${path}/${name}/${id}`);
        },
      };
    },
  };
}

function createDb(initial = {}) {
  const writes = [];
  const db = {
    collection(name) {
      return {
        doc(id) {
          return createRef(`${name}/${id}`);
        },
      };
    },
    async runTransaction(callback) {
      const transaction = {
        async get(ref) {
          const value = initial[ref.path];
          return {
            exists: value !== undefined,
            data: () => value,
          };
        },
        set(ref, data, options) {
          writes.push({ path: ref.path, data, options });
        },
      };
      return callback(transaction);
    },
  };
  return { db, writes };
}

function makeSession() {
  return {
    id: "cs_bundle",
    payment_status: "paid",
    payment_intent: "pi_bundle",
    amount_total: 12000,
    currency: "ron",
    metadata: {
      uid: "user-1",
      purchaseType: "bundle",
      bundleId: "bundle-1",
      courseIds: "course-a,course-b,course-c",
      expectedAmount: "12000",
      expectedCurrency: "RON",
    },
  };
}

describe("course bundle webhook", () => {
  test("parses bundle checkout metadata", () => {
    expect(resolvePurchaseContext(makeSession())).toEqual({
      purchaseType: "bundle",
      courseId: "",
      bundleId: "bundle-1",
      itemId: "bundle-1",
      courseIds: ["course-a", "course-b", "course-c"],
    });
  });

  test("grants only missing courses and records one bundle purchase", async () => {
    const { db, writes } = createDb({
      "courseBundles/bundle-1": {
        courseIds: ["course-a", "course-b", "course-c"],
        purchaseCount: 0,
      },
      "users/user-1/purchases/course-a": {
        status: "paid",
        accessSource: "purchase",
      },
    });
    const event = { id: "evt_bundle_paid", type: "checkout.session.completed" };
    const session = makeSession();

    const result = await processBundleCheckoutSessionEvent(
      db,
      event,
      session,
      resolvePurchaseContext(session)
    );

    expect(result.entitlementGranted).toBe(true);
    expect(writes.some((write) => write.path.endsWith("/purchases/course-a"))).toBe(false);
    expect(writes.some((write) => write.path.endsWith("/purchases/course-b"))).toBe(true);
    expect(writes.some((write) => write.path.endsWith("/purchases/course-c"))).toBe(true);
    expect(
      writes.some((write) => write.path === "users/user-1/bundlePurchases/bundle-1")
    ).toBe(true);
    expect(writes.some((write) => write.path === "courseBundles/bundle-1")).toBe(true);
  });

  test("does not write again when the Stripe event was already processed", async () => {
    const { db, writes } = createDb({
      "stripeWebhookEvents/evt_duplicate": { processedAt: "already" },
    });
    const event = { id: "evt_duplicate", type: "checkout.session.completed" };
    const session = makeSession();

    const result = await processBundleCheckoutSessionEvent(
      db,
      event,
      session,
      resolvePurchaseContext(session)
    );

    expect(result).toMatchObject({ skipped: true, reason: "already_processed" });
    expect(writes).toHaveLength(0);
  });

  test("rejects entitlement when Stripe amount does not match", async () => {
    const { db, writes } = createDb({
      "courseBundles/bundle-1": { courseIds: ["course-a", "course-b", "course-c"] },
    });
    const event = { id: "evt_bad_amount", type: "checkout.session.completed" };
    const session = { ...makeSession(), amount_total: 11999 };

    const result = await processBundleCheckoutSessionEvent(
      db,
      event,
      session,
      resolvePurchaseContext(session)
    );

    expect(result.entitlementGranted).toBe(false);
    expect(
      writes.some((write) => write.path.includes("/purchases/"))
    ).toBe(false);
  });
});
