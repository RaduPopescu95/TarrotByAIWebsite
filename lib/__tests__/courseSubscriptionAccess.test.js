jest.mock("../premiumAccess", () => ({
  hasPremiumAccess: jest.fn(() => true),
}));

import { resolveCourseEntitlement } from "../courseSubscriptionAccess";

function createDb({ purchasePaid = false, premiumUserExists = true } = {}) {
  return {
    collection: jest.fn((collectionName) => ({
      doc: jest.fn(() => {
        if (collectionName === "Users") {
          return {
            get: jest.fn(async () => ({
              exists: premiumUserExists,
              data: () => ({ premium: true }),
            })),
          };
        }

        return {
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              get: jest.fn(async () => ({
                exists: purchasePaid,
                data: () => ({ status: purchasePaid ? "paid" : "pending" }),
              })),
            })),
          })),
        };
      }),
    })),
  };
}

describe("resolveCourseEntitlement", () => {
  test("does not unlock a paid course for a site premium subscriber", async () => {
    const entitlement = await resolveCourseEntitlement(
      createDb(),
      "premium-user",
      "paid-course",
      { price: 100, sitePremiumAccess: true },
      { courseVisible: true }
    );

    expect(entitlement).toMatchObject({
      hasAccess: false,
      purchasePaid: false,
      subscriptionUnlock: false,
      sitePremiumActive: true,
      accessSource: null,
    });
  });

  test("unlocks a paid course only after a paid purchase", async () => {
    const entitlement = await resolveCourseEntitlement(
      createDb({ purchasePaid: true }),
      "buyer",
      "paid-course",
      { price: 100 },
      { courseVisible: true }
    );

    expect(entitlement).toMatchObject({
      hasAccess: true,
      purchasePaid: true,
      subscriptionUnlock: false,
      accessSource: "purchase",
    });
  });

  test("keeps visible zero-price courses available without authentication", async () => {
    const entitlement = await resolveCourseEntitlement(
      createDb(),
      null,
      "free-course",
      { price: 0 },
      { courseVisible: true }
    );

    expect(entitlement).toMatchObject({
      hasAccess: true,
      accessSource: "free",
    });
  });
});
