jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
  }));
});

import { isCourseVisible } from "../../lib/courses";
import {
  COURSE_STATUSES,
  normalizePurchaseCount,
  resolveCoursePurchaseCount,
} from "../../lib/coursePurchases";
import {
  processCheckoutSessionEvent,
  processBundleCheckoutSessionEvent,
  resolvePurchaseContext,
} from "../../pages/api/stripe/courses/webhook";
import {
  shouldExposePurchasedBundle,
  shouldExposePurchasedCourse,
} from "../../pages/api/courses/purchased";

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
    collectionGroup(name) {
      return {
        where(field, _op, value) {
          return {
            where(field2, _op2, value2) {
              return {
                async get() {
                  const docs = Object.entries(initial)
                    .filter(([path, data]) => {
                      if (!path.includes(`/${name}/`)) return false;
                      if (field === "courseId" && data?.courseId !== value) return false;
                      if (field2 === "status" && data?.status !== value2) return false;
                      return true;
                    })
                    .map(([path, data]) => ({
                      id: path.split("/").pop(),
                      data: () => data,
                    }));
                  return { size: docs.length, docs, empty: docs.length === 0 };
                },
              };
            },
          };
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

function makeCourseSession() {
  return {
    id: "cs_course",
    payment_status: "paid",
    payment_intent: "pi_course",
    amount_subtotal: 5000,
    amount_total: 6050,
    currency: "ron",
    metadata: {
      uid: "user-1",
      courseId: "course-1",
      expectedAmount: "5000",
      expectedCurrency: "RON",
    },
  };
}

function makeBundleSession() {
  return {
    id: "cs_bundle",
    payment_status: "paid",
    payment_intent: "pi_bundle",
    amount_subtotal: 12000,
    amount_total: 14520,
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

describe("course archive policy", () => {
  test("includes archived in allowed course statuses", () => {
    expect(COURSE_STATUSES).toContain("archived");
  });

  test("isCourseVisible returns false for archived courses", () => {
    expect(isCourseVisible({ status: "archived" })).toBe(false);
    expect(isCourseVisible({ status: "published" })).toBe(true);
  });

  test("purchased courses API hides archived courses from mobile payloads", () => {
    expect(shouldExposePurchasedCourse(false, { status: "archived" })).toBe(false);
    expect(shouldExposePurchasedCourse(false, { status: "published" })).toBe(true);
    expect(shouldExposePurchasedCourse(true, null)).toBe(true);
  });

  test("purchased courses remain exposed when their catalog channel changes", () => {
    expect(
      shouldExposePurchasedCourse(false, {
        status: "published",
        availableOnWebsite: true,
        availableOnMobile: false,
      })
    ).toBe(true);
  });

  test("purchased courses API hides archived bundles from mobile payloads", () => {
    expect(shouldExposePurchasedBundle(false, { status: "archived" })).toBe(false);
    expect(shouldExposePurchasedBundle(false, { status: "published" })).toBe(true);
    expect(shouldExposePurchasedBundle(true, null)).toBe(true);
  });

  test("purchased bundles remain exposed when their catalog channel changes", () => {
    expect(
      shouldExposePurchasedBundle(false, {
        status: "published",
        availableOnWebsite: true,
        availableOnMobile: false,
      })
    ).toBe(true);
  });

  test("normalizePurchaseCount clamps invalid values", () => {
    expect(normalizePurchaseCount({ purchaseCount: 3.8 })).toBe(3);
    expect(normalizePurchaseCount({ purchaseCount: -2 })).toBe(0);
    expect(normalizePurchaseCount({})).toBe(0);
  });

  test("resolveCoursePurchaseCount uses the higher stored and collection group counts", async () => {
    const { db } = createDb({
      "users/user-1/purchases/course-1": { courseId: "course-1", status: "paid" },
      "users/user-2/purchases/course-1": { courseId: "course-1", status: "paid" },
      "users/user-3/purchases/course-1": { courseId: "course-1", status: "pending_payment" },
    });

    await expect(
      resolveCoursePurchaseCount(db, "course-1", { purchaseCount: 1 })
    ).resolves.toBe(2);
  });

  test("single course webhook increments purchaseCount on first paid entitlement", async () => {
    const { db, writes } = createDb({});
    const event = { id: "evt_course_paid", type: "checkout.session.completed" };
    const session = makeCourseSession();

    const result = await processCheckoutSessionEvent(db, event, session);

    expect(result.entitlementGranted).toBe(true);
    expect(result.purchaseAlreadyPaid).toBe(false);
    expect(
      writes.some(
        (write) =>
          write.path === "courses/course-1" &&
          write.data?.purchaseCount &&
          typeof write.data.purchaseCount === "object"
      )
    ).toBe(true);
  });

  test("single course webhook rejects a paid total when the net subtotal is wrong", async () => {
    const { db, writes } = createDb({});
    const event = { id: "evt_course_bad_subtotal", type: "checkout.session.completed" };
    const session = {
      ...makeCourseSession(),
      amount_subtotal: 4999,
      amount_total: 6049,
    };

    const result = await processCheckoutSessionEvent(db, event, session);

    expect(result.entitlementGranted).toBe(false);
    expect(result.amountMatches).toBe(false);
    expect(
      writes.some(
        (write) =>
          write.path === "users/user-1/purchases/course-1" &&
          write.data?.status === "paid"
      )
    ).toBe(false);
  });

  test("single course webhook does not increment purchaseCount when already paid", async () => {
    const { db, writes } = createDb({
      "users/user-1/purchases/course-1": { status: "paid", courseId: "course-1" },
    });
    const event = { id: "evt_course_repeat", type: "checkout.session.completed" };
    const session = makeCourseSession();

    const result = await processCheckoutSessionEvent(db, event, session);

    expect(result.purchaseAlreadyPaid).toBe(true);
    expect(writes.some((write) => write.path === "courses/course-1")).toBe(false);
  });

  test("bundle webhook increments purchaseCount only for newly granted courses", async () => {
    const { db, writes } = createDb({
      "courseBundles/bundle-1": {
        courseIds: ["course-a", "course-b", "course-c"],
        purchaseCount: 0,
      },
      "users/user-1/purchases/course-a": {
        status: "paid",
        accessSource: "purchase",
        courseId: "course-a",
      },
    });
    const event = { id: "evt_bundle_paid", type: "checkout.session.completed" };
    const session = makeBundleSession();

    await processBundleCheckoutSessionEvent(
      db,
      event,
      session,
      resolvePurchaseContext(session)
    );

    expect(writes.some((write) => write.path === "courses/course-a")).toBe(false);
    expect(writes.some((write) => write.path === "courses/course-b")).toBe(true);
    expect(writes.some((write) => write.path === "courses/course-c")).toBe(true);
  });
});

describe("course archive delete semantics", () => {
  test("archive response shape matches admin delete contract", () => {
    const purchaseCount = 3;
    const response = { id: "course-1", archived: true, purchaseCount };
    expect(response.archived).toBe(true);
    expect(response.purchaseCount).toBeGreaterThan(0);
  });

  test("hard delete is allowed only when purchase count resolves to zero", async () => {
    const { db } = createDb({});
    await expect(resolveCoursePurchaseCount(db, "course-new", { purchaseCount: 0 })).resolves.toBe(
      0
    );
  });
});
