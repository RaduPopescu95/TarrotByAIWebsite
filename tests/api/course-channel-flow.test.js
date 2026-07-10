jest.mock("../../lib/firebaseAdmin", () => ({
  getAdminDb: jest.fn(),
}));

jest.mock("../../lib/requireAuth", () => ({
  requireDashboardAccess: jest.fn(),
}));

jest.mock("../../lib/vimeo", () => ({
  fetchVimeoPreviewThumbnail: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../lib/coursesCache", () => ({
  loadVisibleCourseCandidates: jest.fn(),
}));

jest.mock("../../lib/firestoreCostLogger", () => ({
  withFirestoreReadTelemetry: (_route, handler) => handler,
}));

import { getAdminDb } from "../../lib/firebaseAdmin";
import { loadVisibleCourseCandidates } from "../../lib/coursesCache";
import adminCoursesHandler from "../../pages/api/admin/courses";
import publicCoursesHandler from "../../pages/api/courses";

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

function createAdminDb() {
  const writes = [];
  const refs = new Map();
  const refFor = (collection, id) => {
    const key = `${collection}/${id}`;
    if (!refs.has(key)) refs.set(key, { id, path: key });
    return refs.get(key);
  };

  return {
    writes,
    collection(name) {
      return {
        doc(id = "course-new") {
          return refFor(name, id);
        },
      };
    },
    batch() {
      return {
        set(ref, data) {
          writes.push({ operation: "set", path: ref.path, data });
        },
        async commit() {},
      };
    },
  };
}

function validCourseInput(overrides = {}) {
  return {
    title: "Curs Website",
    description: "Descriere curs",
    platform: "vimeo",
    videoUrl: "https://vimeo.com/123456789",
    categoryIds: [],
    price: 99,
    currency: "RON",
    status: "published",
    featuredOnHome: false,
    availableOnWebsite: true,
    availableOnMobile: false,
    curriculumLessons: [],
    ...overrides,
  };
}

describe("course dashboard to public catalog flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a website-only course and exposes it only to the website catalog", async () => {
    const db = createAdminDb();
    getAdminDb.mockReturnValue(db);

    const createRes = createResponse();
    await adminCoursesHandler(
      { method: "POST", body: validCourseInput(), headers: {}, query: {} },
      createRes
    );

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toEqual({ id: "course-new" });

    const courseWrite = db.writes.find((write) => write.path === "courses/course-new");
    expect(courseWrite?.data).toMatchObject({
      title: "Curs Website",
      status: "published",
      availableOnWebsite: true,
      availableOnMobile: false,
      createdBy: "dashboard",
    });

    loadVisibleCourseCandidates.mockResolvedValue([
      { id: "course-new", ...courseWrite.data },
    ]);

    const websiteRes = createResponse();
    await publicCoursesHandler(
      { method: "GET", query: { locale: "ro", channel: "website" }, headers: {} },
      websiteRes
    );
    expect(websiteRes.statusCode).toBe(200);
    expect(websiteRes.body.courses.map((course) => course.id)).toEqual(["course-new"]);

    const legacyMobileRes = createResponse();
    await publicCoursesHandler(
      { method: "GET", query: { locale: "ro" }, headers: {} },
      legacyMobileRes
    );
    expect(legacyMobileRes.statusCode).toBe(200);
    expect(legacyMobileRes.body.courses).toEqual([]);
  });

  test("rejects a published course with no selected channel", async () => {
    const db = createAdminDb();
    getAdminDb.mockReturnValue(db);
    const res = createResponse();

    await adminCoursesHandler(
      {
        method: "POST",
        body: validCourseInput({ availableOnWebsite: false, availableOnMobile: false }),
        headers: {},
        query: {},
      },
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.fields).toContain("availability");
    expect(db.writes).toEqual([]);
  });

  test("defaults legacy create requests to both channels", async () => {
    const db = createAdminDb();
    getAdminDb.mockReturnValue(db);
    const res = createResponse();
    const input = validCourseInput();
    delete input.availableOnWebsite;
    delete input.availableOnMobile;

    await adminCoursesHandler(
      { method: "POST", body: input, headers: {}, query: {} },
      res
    );

    const courseWrite = db.writes.find((write) => write.path === "courses/course-new");
    expect(courseWrite?.data.availableOnWebsite).toBe(true);
    expect(courseWrite?.data.availableOnMobile).toBe(true);
  });
});
