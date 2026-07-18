const isIosPremiumSubscriptionsEnabled = jest.fn();
const getAdminDb = jest.fn();
const auditPremiumVideoAccess = jest.fn();

jest.mock("../globalSettings", () => ({
  isIosPremiumSubscriptionsEnabled: (...args) => isIosPremiumSubscriptionsEnabled(...args),
}));

jest.mock("../firebaseAdmin", () => ({
  getAdminDb: (...args) => getAdminDb(...args),
}));

jest.mock("../premiumVideoAccessAudit", () => ({
  auditPremiumVideoAccess: (...args) => auditPremiumVideoAccess(...args),
}));

jest.mock("../firestoreCostLogger", () => ({
  withFirestoreCostLog: (_meta, fn) => fn(),
}));

import {
  resolvePublicVideoLibraryPremiumActive,
  resolveVideoLibraryPremiumAccessForUser,
} from "../videoLibraryAccess";

function mockUserDoc(data, exists = true) {
  const get = jest.fn(async () => ({
    exists,
    data: () => data,
  }));
  const doc = jest.fn(() => ({ get }));
  const collection = jest.fn(() => ({ doc }));
  getAdminDb.mockReturnValue({ collection });
  return { collection, doc, get };
}

describe("videoLibraryAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(true);
  });

  it("keeps public website access locked when the global subscription toggle is disabled", async () => {
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(false);

    await expect(resolvePublicVideoLibraryPremiumActive({ webClient: true })).resolves.toBe(false);
  });

  it("unlocks public access only for an explicit iOS app when the iOS toggle is disabled", async () => {
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(false);

    await expect(resolvePublicVideoLibraryPremiumActive({ appPlatform: "ios" })).resolves.toBe(true);
    await expect(resolvePublicVideoLibraryPremiumActive({ appPlatform: "android" })).resolves.toBe(false);
    await expect(resolvePublicVideoLibraryPremiumActive()).resolves.toBe(false);
  });

  it("checks the user subscription on web even when the global subscription toggle is disabled", async () => {
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(false);
    mockUserDoc({ premium: false, subscriptionStatus: "expired" });

    await expect(
      resolveVideoLibraryPremiumAccessForUser("user-1", { webClient: true })
    ).resolves.toEqual(
      expect.objectContaining({
        premiumActive: false,
        subscriptionSystemEnabled: false,
        userDocExists: true,
      })
    );
    expect(getAdminDb).toHaveBeenCalledTimes(1);
  });

  it("unlocks an authenticated request only when it explicitly declares iOS", async () => {
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(false);

    await expect(
      resolveVideoLibraryPremiumAccessForUser("user-1", { appPlatform: "ios" })
    ).resolves.toEqual(
      expect.objectContaining({
        premiumActive: true,
        subscriptionSystemEnabled: false,
        userDocExists: null,
      })
    );
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});
