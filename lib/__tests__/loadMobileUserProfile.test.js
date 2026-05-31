import {
  clearMobileUserProfileCache,
  loadMobileUserProfile,
  trimMobileUserProfile,
} from "../loadMobileUserProfile";

const withFirestoreCostLog = jest.fn(async (_meta, fn) => fn());

jest.mock("../firebaseAdmin", () => ({
  getAdminDb: jest.fn(),
}));

jest.mock("../firestoreCostLogger", () => ({
  withFirestoreCostLog: (...args) => withFirestoreCostLog(...args),
}));

const { getAdminDb } = require("../firebaseAdmin");

describe("loadMobileUserProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMobileUserProfileCache();
  });

  it("trims profile fields to the mobile DTO allowlist", () => {
    const trimmed = trimMobileUserProfile({
      owner_uid: "uid-1",
      first_name: "Ana",
      email: "ana@example.com",
      premium: true,
      natalData: { huge: "payload" },
      generalSignTextData: { a: 1 },
    });

    expect(trimmed).toEqual({
      owner_uid: "uid-1",
      first_name: "Ana",
      email: "ana@example.com",
      premium: true,
    });
    expect(trimmed.natalData).toBeUndefined();
  });

  it("caches profile responses for repeated requests", async () => {
    const get = jest.fn(async () => ({
      exists: true,
      data: () => ({
        owner_uid: "uid-1",
        first_name: "Ana",
        premium: true,
      }),
    }));

    getAdminDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ get })),
        where: jest.fn(),
      })),
    });

    const first = await loadMobileUserProfile("uid-1");
    const second = await loadMobileUserProfile("uid-1");

    expect(first.user).toEqual({
      owner_uid: "uid-1",
      first_name: "Ana",
      premium: true,
    });
    expect(second).toEqual(first);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when fresh=true", async () => {
    const get = jest.fn(async () => ({
      exists: true,
      data: () => ({
        owner_uid: "uid-1",
        first_name: "Ana",
      }),
    }));

    getAdminDb.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({ get })),
        where: jest.fn(),
      })),
    });

    await loadMobileUserProfile("uid-1");
    await loadMobileUserProfile("uid-1", { fresh: true });

    expect(get).toHaveBeenCalledTimes(2);
  });
});
