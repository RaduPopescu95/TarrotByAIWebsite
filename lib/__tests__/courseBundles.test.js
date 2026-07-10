import {
  hasValidBundleCourseIds,
  hasAtLeastOneCourseBundleChannel,
  isCourseBundleAvailableOnChannel,
  isCourseBundleVisibleOnChannel,
  normalizeBundleCourseIds,
  resolveBundleCourseChannelCompatibility,
  resolveBundleAccess,
  resolveBundleThumbnailUrl,
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
  test("legacy bundles default to both channels", () => {
    const legacyBundle = { status: "published" };
    expect(isCourseBundleAvailableOnChannel(legacyBundle, "website")).toBe(true);
    expect(isCourseBundleAvailableOnChannel(legacyBundle, "mobile")).toBe(true);
    expect(isCourseBundleVisibleOnChannel(legacyBundle, "website")).toBe(true);
    expect(isCourseBundleVisibleOnChannel(legacyBundle, "mobile")).toBe(true);
    expect(hasAtLeastOneCourseBundleChannel(legacyBundle)).toBe(true);
  });

  test("enforces independent website and mobile bundle channels", () => {
    const websiteOnly = {
      status: "published",
      availableOnWebsite: true,
      availableOnMobile: false,
    };
    expect(isCourseBundleVisibleOnChannel(websiteOnly, "website")).toBe(true);
    expect(isCourseBundleVisibleOnChannel(websiteOnly, "mobile")).toBe(false);
    expect(
      hasAtLeastOneCourseBundleChannel({
        availableOnWebsite: false,
        availableOnMobile: false,
      })
    ).toBe(false);
  });

  test("reports exact courses incompatible with enabled bundle channels", async () => {
    const records = {
      a: { status: "published", availableOnWebsite: true, availableOnMobile: true },
      b: { status: "published", availableOnWebsite: true, availableOnMobile: false },
      c: { status: "draft", availableOnWebsite: true, availableOnMobile: true },
    };
    const db = {
      collection: () => ({
        doc: (id) => ({
          get: async () => ({
            exists: Boolean(records[id]),
            data: () => records[id],
          }),
        }),
      }),
    };

    await expect(
      resolveBundleCourseChannelCompatibility(db, ["a", "b", "c", "missing"], {
        availableOnWebsite: true,
        availableOnMobile: true,
      })
    ).resolves.toEqual({
      compatible: false,
      missingCourseIds: ["missing"],
      incompatibleCourseIds: {
        website: ["c"],
        mobile: ["b", "c"],
      },
    });
  });

  test("requires at least two distinct course ids", () => {
    expect(hasValidBundleCourseIds(["a", "b"])).toBe(true);
    expect(hasValidBundleCourseIds(["a", "b", "c"])).toBe(true);
    expect(hasValidBundleCourseIds(["a", "b", "c", "d"])).toBe(true);
    expect(hasValidBundleCourseIds(["a"])).toBe(false);
    expect(hasValidBundleCourseIds([])).toBe(false);
    expect(hasValidBundleCourseIds(["a", "a"])).toBe(false);
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
        availableOnWebsite: true,
        availableOnMobile: false,
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
    expect(bundle).not.toHaveProperty("availableOnWebsite");
    expect(bundle).not.toHaveProperty("availableOnMobile");
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

describe("resolveBundleThumbnailUrl", () => {
  const courses = [
    { id: "a", thumbnailUrl: "https://cdn.example.com/a.jpg" },
    { id: "b", thumbnailUrl: "https://cdn.example.com/b.jpg" },
    { id: "c", thumbnailUrl: null },
  ];

  test("returns linked course thumbnail when coverSource is 'course'", () => {
    expect(
      resolveBundleThumbnailUrl(
        { coverSource: "course", coverCourseId: "b", thumbnailUrl: "ignored" },
        courses
      )
    ).toBe("https://cdn.example.com/b.jpg");
  });

  test("returns null when linked course is missing from loaded courses", () => {
    expect(
      resolveBundleThumbnailUrl(
        { coverSource: "course", coverCourseId: "missing" },
        courses
      )
    ).toBe(null);
  });

  test("returns null when linked course has no thumbnail", () => {
    expect(
      resolveBundleThumbnailUrl(
        { coverSource: "course", coverCourseId: "c" },
        courses
      )
    ).toBe(null);
  });

  test("returns custom thumbnail when coverSource is 'custom'", () => {
    expect(
      resolveBundleThumbnailUrl(
        {
          coverSource: "custom",
          thumbnailUrl: "https://storage.example.com/cover.jpg",
        },
        courses
      )
    ).toBe("https://storage.example.com/cover.jpg");
  });

  test("returns null for custom source with empty thumbnail", () => {
    expect(
      resolveBundleThumbnailUrl(
        { coverSource: "custom", thumbnailUrl: "  " },
        courses
      )
    ).toBe(null);
  });

  test("returns null when coverSource is 'none'", () => {
    expect(
      resolveBundleThumbnailUrl(
        {
          coverSource: "none",
          thumbnailUrl: "https://legacy.example.com/cover.jpg",
        },
        courses
      )
    ).toBe(null);
  });

  test("falls back to legacy thumbnailUrl when coverSource is missing", () => {
    expect(
      resolveBundleThumbnailUrl(
        { thumbnailUrl: "https://legacy.example.com/cover.jpg" },
        courses
      )
    ).toBe("https://legacy.example.com/cover.jpg");
  });

  test("returns null when nothing is set and no legacy URL exists", () => {
    expect(resolveBundleThumbnailUrl({}, courses)).toBe(null);
  });
});

describe("toSafeCourseBundle cover resolution", () => {
  test("exposes resolved live thumbnail for course-linked cover", () => {
    const bundle = toSafeCourseBundle(
      "bundle-1",
      {
        title: "Trilogie",
        description: "Descriere",
        courseIds: ["a", "b"],
        price: 100,
        currency: "RON",
        status: "published",
        coverSource: "course",
        coverCourseId: "b",
      },
      "ro",
      [
        { id: "a", thumbnailUrl: "https://cdn.example.com/a.jpg" },
        { id: "b", thumbnailUrl: "https://cdn.example.com/b.jpg" },
      ]
    );

    expect(bundle.coverSource).toBe("course");
    expect(bundle.coverCourseId).toBe("b");
    expect(bundle.thumbnailUrl).toBe("https://cdn.example.com/b.jpg");
  });

  test("exposes custom thumbnail when coverSource is 'custom'", () => {
    const bundle = toSafeCourseBundle(
      "bundle-2",
      {
        title: "Trilogie",
        description: "Descriere",
        courseIds: ["a", "b"],
        price: 100,
        currency: "RON",
        status: "published",
        coverSource: "custom",
        thumbnailUrl: "https://storage.example.com/cover.jpg",
      },
      "ro",
      [{ id: "a" }, { id: "b" }]
    );

    expect(bundle.coverSource).toBe("custom");
    expect(bundle.coverCourseId).toBe(null);
    expect(bundle.thumbnailUrl).toBe("https://storage.example.com/cover.jpg");
  });

  test("backwards compat: legacy thumbnailUrl shows through when coverSource missing", () => {
    const bundle = toSafeCourseBundle(
      "bundle-3",
      {
        title: "Trilogie",
        description: "Descriere",
        courseIds: ["a", "b"],
        price: 100,
        currency: "RON",
        status: "published",
        thumbnailUrl: "https://legacy.example.com/cover.jpg",
      },
      "ro",
      [{ id: "a" }, { id: "b" }]
    );

    expect(bundle.coverSource).toBe("none");
    expect(bundle.thumbnailUrl).toBe("https://legacy.example.com/cover.jpg");
  });
});
