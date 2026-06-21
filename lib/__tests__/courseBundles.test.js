import {
  hasValidBundleCourseIds,
  normalizeBundleCourseIds,
  resolveBundleAccess,
  toSafeCourseBundle,
} from "../courseBundles";

function createDb({ paidCourses = [], bundlePaid = false } = {}) {
  return {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn((collectionName) => ({
          doc: jest.fn((documentId) => ({
            get: jest.fn(async () => {
              if (collectionName === "bundlePurchases") {
                return {
                  exists: bundlePaid,
                  data: () => ({ status: bundlePaid ? "paid" : "pending" }),
                };
              }
              const paid = paidCourses.includes(documentId);
              return {
                exists: paid,
                data: () => ({ status: paid ? "paid" : "pending" }),
              };
            }),
          })),
        })),
      })),
    })),
  };
}

describe("course bundles", () => {
  test("requires exactly three distinct course ids", () => {
    expect(hasValidBundleCourseIds(["a", "b", "c"])).toBe(true);
    expect(hasValidBundleCourseIds(["a", "a", "c"])).toBe(false);
    expect(hasValidBundleCourseIds(["a", "b"])).toBe(false);
    expect(normalizeBundleCourseIds([" a ", "b", "a", "", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("localizes bundle fields and keeps only safe public fields", () => {
    const bundle = toSafeCourseBundle(
      "bundle-1",
      {
        title: "Titlu",
        description: "Descriere",
        locales: {
          en: { title: "Title", description: "Description" },
        },
        courseIds: ["a", "b", "c"],
        price: 99,
        currency: "EUR",
        status: "published",
      },
      "en",
      [{ id: "a" }]
    );

    expect(bundle).toMatchObject({
      id: "bundle-1",
      title: "Title",
      description: "Description",
      courseIds: ["a", "b", "c"],
      price: 99,
      currency: "EUR",
      status: "published",
    });
    expect(bundle.courses).toEqual([{ id: "a" }]);
  });

  test("reports partial ownership without granting the whole bundle", async () => {
    const result = await resolveBundleAccess(
      createDb({ paidCourses: ["a"] }),
      "user-1",
      "bundle-1",
      { courseIds: ["a", "b", "c"] }
    );

    expect(result).toEqual({
      hasAccess: false,
      bundlePurchasePaid: false,
      ownedCourseIds: ["a"],
      missingCourseIds: ["b", "c"],
    });
  });

  test("blocks checkout when all courses are already owned", async () => {
    const result = await resolveBundleAccess(
      createDb({ paidCourses: ["a", "b", "c"] }),
      "user-1",
      "bundle-1",
      { courseIds: ["a", "b", "c"] }
    );

    expect(result.hasAccess).toBe(true);
    expect(result.missingCourseIds).toEqual([]);
  });
});
