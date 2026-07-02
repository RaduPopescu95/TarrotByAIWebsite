const isSubscriptionSystemEnabled = jest.fn();
const getAdminDb = jest.fn();
const auditPremiumVideoAccess = jest.fn();

jest.mock("../globalSettings", () => ({
  isSubscriptionSystemEnabled: (...args) => isSubscriptionSystemEnabled(...args),
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
    isSubscriptionSystemEnabled.mockResolvedValue(true);
  });

  it("keeps public website access locked when the global subscription toggle is disabled", async () => {
    isSubscriptionSystemEnabled.mockResolvedValue(false);

    await expect(resolvePublicVideoLibraryPremiumActive({ webClient: true })).resolves.toBe(false);
  });

  it("keeps legacy non-web public access unlocked when the global subscription toggle is disabled", async () => {
    isSubscriptionSystemEnabled.mockResolvedValue(false);

    await expect(resolvePublicVideoLibraryPremiumActive()).resolves.toBe(true);
  });

  it("checks the user subscription on web even when the global subscription toggle is disabled", async () => {
    isSubscriptionSystemEnabled.mockResolvedValue(false);
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

  it("keeps legacy non-web user access unlocked when the global subscription toggle is disabled", async () => {
    isSubscriptionSystemEnabled.mockResolvedValue(false);

    await expect(resolveVideoLibraryPremiumAccessForUser("user-1")).resolves.toEqual(
      expect.objectContaining({
        premiumActive: true,
        subscriptionSystemEnabled: false,
        userDocExists: null,
      })
    );
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});
