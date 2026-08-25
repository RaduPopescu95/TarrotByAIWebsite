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

  it("never unlocks public access when native billing is disabled", async () => {
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(false);

    await expect(resolvePublicVideoLibraryPremiumActive({ appPlatform: "ios" })).resolves.toBe(false);
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

  it("checks entitlement for iOS even when the legacy toggle is false", async () => {
    isIosPremiumSubscriptionsEnabled.mockResolvedValue(false);
    mockUserDoc({ premium: false, subscriptionStatus: "expired" });

    await expect(
      resolveVideoLibraryPremiumAccessForUser("user-1", { appPlatform: "ios" })
    ).resolves.toEqual(
      expect.objectContaining({
        premiumActive: false,
        subscriptionSystemEnabled: false,
        userDocExists: true,
      })
    );
    expect(getAdminDb).toHaveBeenCalledTimes(1);
  });
});
