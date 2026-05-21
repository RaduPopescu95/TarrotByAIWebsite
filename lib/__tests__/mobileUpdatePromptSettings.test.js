const mockSet = jest.fn();
const mockGet = jest.fn();

jest.mock("../firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: mockGet,
        set: mockSet,
      }),
    }),
  }),
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
  },
}));

import {
  getMobileForceUpdateEnabled,
  getMobileUpdatePromptEnabled,
  setMobileForceUpdateEnabled,
  setMobileUpdatePromptEnabled,
} from "../mobileUpdatePromptSettings";

describe("mobileUpdatePromptSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads missing update settings as disabled", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    mockGet.mockResolvedValueOnce({ exists: false });

    await expect(getMobileUpdatePromptEnabled()).resolves.toBe(false);
    await expect(getMobileForceUpdateEnabled()).resolves.toBe(false);
  });

  it("disabling the soft prompt also disables forceUpdate", async () => {
    await setMobileUpdatePromptEnabled(false, "test");

    expect(mockSet).toHaveBeenCalledWith(
      {
        update: false,
        forceUpdate: false,
        updatedAt: "server-timestamp",
        updatedBy: "test",
      },
      { merge: true }
    );
  });

  it("enabling forceUpdate normalizes update to true", async () => {
    await setMobileForceUpdateEnabled(true, "test");

    expect(mockSet).toHaveBeenCalledWith(
      {
        update: true,
        forceUpdate: true,
        updatedAt: "server-timestamp",
        updatedBy: "test",
      },
      { merge: true }
    );
  });
});
