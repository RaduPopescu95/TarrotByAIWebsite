jest.mock("../../lib/firebaseAdmin", () => ({
  getAdminDb: jest.fn(),
}));

jest.mock("../../lib/requireAuth", () => ({
  requireDashboardAccess: jest.fn(),
  getOptionalAuth: jest.fn().mockResolvedValue(null),
}));

import { getAdminDb } from "../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../lib/requireAuth";
import adminBundlesHandler from "../../pages/api/admin/course-bundles";
import adminBundleDetailHandler from "../../pages/api/admin/course-bundles/[bundleId]";
import publicBundlesHandler from "../../pages/api/course-bundles";
import bundleDetailHandler from "../../pages/api/course-bundles/[bundleId]";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createDb({ courses = {}, bundles = {}, bundlePurchases = {}, purchases = {} } = {}) {
  const state = {
    courses: { ...courses },
    courseBundles: { ...bundles },
  };

  const snapshotFor = (id, value) => ({
    id,
    exists: value !== undefined,
    data: () => value,
  });

  return {
    state,
    collection(name) {
      if (name === "users") {
        return {
          doc(uid) {
            return {
              collection(subcollection) {
                return {
                  doc(id) {
                    const source = subcollection === "bundlePurchases" ? bundlePurchases : purchases;
                    const value = source[`${uid}/${id}`];
                    return { get: async () => snapshotFor(id, value) };
                  },
                };
              },
            };
          },
        };
      }

      const source = state[name];
      if (!source) throw new Error(`Unexpected collection ${name}`);
      return {
        doc(id = "bundle-new") {
          return {
            id,
            async get() {
              return snapshotFor(id, source[id]);
            },
            async set(payload, options) {
              source[id] = options?.merge ? { ...(source[id] || {}), ...payload } : payload;
            },
          };
        },
        where(field, operator, value) {
          if (field !== "status" || operator !== "==") throw new Error("Unexpected query");
          return {
            async get() {
              const docs = Object.entries(source)
                .filter(([, data]) => data?.[field] === value)
                .map(([id, data]) => snapshotFor(id, data));
              return { docs, empty: docs.length === 0, size: docs.length };
            },
          };
        },
      };
    },
  };
}

const websiteOnlyCourses = {
  a: {
    title: "Curs A",
    description: "A",
    status: "published",
    availableOnWebsite: true,
    availableOnMobile: false,
  },
  b: {
    title: "Curs B",
    description: "B",
    status: "published",
    availableOnWebsite: true,
    availableOnMobile: false,
  },
};

function validBundleInput(overrides = {}) {
  return {
    title: "Pachet Website",
    description: "Două cursuri",
    courseIds: ["a", "b"],
    price: 149,
    currency: "RON",
    status: "published",
    coverSource: "none",
    availableOnWebsite: true,
    availableOnMobile: false,
    ...overrides,
  };
}

describe("course bundle channel flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOptionalAuth.mockResolvedValue(null);
  });

  test("dashboard creates a website-only bundle hidden from legacy mobile catalog", async () => {
    const db = createDb({ courses: websiteOnlyCourses });
    getAdminDb.mockReturnValue(db);
    const createRes = createResponse();

    await adminBundlesHandler(
      { method: "POST", body: validBundleInput(), query: {}, headers: {} },
      createRes
    );

    expect(createRes.statusCode).toBe(201);
    expect(db.state.courseBundles["bundle-new"]).toMatchObject({
      status: "published",
      availableOnWebsite: true,
      availableOnMobile: false,
    });

    const websiteRes = createResponse();
    await publicBundlesHandler(
      { method: "GET", query: { locale: "ro", channel: "website" }, headers: {} },
      websiteRes
    );
    expect(websiteRes.body.bundles.map((bundle) => bundle.id)).toEqual(["bundle-new"]);

    const legacyMobileRes = createResponse();
    await publicBundlesHandler(
      { method: "GET", query: { locale: "ro" }, headers: {} },
      legacyMobileRes
    );
    expect(legacyMobileRes.body.bundles).toEqual([]);
  });

  test("legacy bundle input defaults to both channels", async () => {
    const bothChannelCourses = Object.fromEntries(
      Object.entries(websiteOnlyCourses).map(([id, course]) => [
        id,
        { ...course, availableOnMobile: true },
      ])
    );
    const db = createDb({ courses: bothChannelCourses });
    getAdminDb.mockReturnValue(db);
    const input = validBundleInput();
    delete input.availableOnWebsite;
    delete input.availableOnMobile;

    await adminBundlesHandler(
      { method: "POST", body: input, query: {}, headers: {} },
      createResponse()
    );

    expect(db.state.courseBundles["bundle-new"].availableOnWebsite).toBe(true);
    expect(db.state.courseBundles["bundle-new"].availableOnMobile).toBe(true);
  });

  test("rejects a published bundle with no channel", async () => {
    const db = createDb({ courses: websiteOnlyCourses });
    getAdminDb.mockReturnValue(db);
    const res = createResponse();

    await adminBundlesHandler(
      {
        method: "POST",
        body: validBundleInput({ availableOnWebsite: false, availableOnMobile: false }),
        query: {},
        headers: {},
      },
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.fields).toContain("availability");
  });

  test("allows a draft bundle with both channels disabled", async () => {
    const db = createDb({ courses: websiteOnlyCourses });
    getAdminDb.mockReturnValue(db);
    const res = createResponse();

    await adminBundlesHandler(
      {
        method: "POST",
        body: validBundleInput({
          status: "draft",
          availableOnWebsite: false,
          availableOnMobile: false,
        }),
        query: {},
        headers: {},
      },
      res
    );

    expect(res.statusCode).toBe(201);
    expect(db.state.courseBundles["bundle-new"]).toMatchObject({
      status: "draft",
      availableOnWebsite: false,
      availableOnMobile: false,
    });
  });

  test("rejects publication on a channel unsupported by an included course", async () => {
    const db = createDb({ courses: websiteOnlyCourses });
    getAdminDb.mockReturnValue(db);
    const res = createResponse();

    await adminBundlesHandler(
      {
        method: "POST",
        body: validBundleInput({ availableOnMobile: true }),
        query: {},
        headers: {},
      },
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.incompatibleCourseIds.mobile).toEqual(["a", "b"]);
  });

  test("allows changing channels after purchase while keeping bundle composition locked", async () => {
    const db = createDb({
      courses: websiteOnlyCourses,
      bundles: {
        "bundle-1": {
          ...validBundleInput({ availableOnMobile: true }),
          purchaseCount: 2,
        },
      },
    });
    getAdminDb.mockReturnValue(db);
    const res = createResponse();

    await adminBundleDetailHandler(
      {
        method: "PUT",
        query: { bundleId: "bundle-1" },
        body: { availableOnWebsite: true, availableOnMobile: false },
        headers: {},
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(db.state.courseBundles["bundle-1"]).toMatchObject({
      courseIds: ["a", "b"],
      purchaseCount: 2,
      availableOnWebsite: true,
      availableOnMobile: false,
    });
  });

  test("mobile direct access is denied except for an existing bundle buyer", async () => {
    const bundle = validBundleInput();
    const db = createDb({
      courses: websiteOnlyCourses,
      bundles: { "bundle-1": bundle },
      bundlePurchases: { "user-1/bundle-1": { status: "paid" } },
    });
    getAdminDb.mockReturnValue(db);

    const deniedRes = createResponse();
    await bundleDetailHandler(
      { method: "GET", query: { bundleId: "bundle-1", locale: "ro" }, headers: {} },
      deniedRes
    );
    expect(deniedRes.statusCode).toBe(404);

    getOptionalAuth.mockResolvedValue({ uid: "user-1" });
    const buyerRes = createResponse();
    await bundleDetailHandler(
      { method: "GET", query: { bundleId: "bundle-1", locale: "ro" }, headers: {} },
      buyerRes
    );
    expect(buyerRes.statusCode).toBe(200);
    expect(buyerRes.body.hasAccess).toBe(true);
    expect(buyerRes.body.bundle.courses.map((course) => course.id)).toEqual(["a", "b"]);
  });
});
