import {
  claimAdsterraSlot,
  getAdsterraMaxSlotsPerPage,
  resetAdsterraPageRegistry,
} from "./adsterraRegistry";

describe("adsterraRegistry", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetAdsterraPageRegistry();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("defaults to three slots per page", () => {
    delete process.env.NEXT_PUBLIC_ADSTERRA_MAX_SLOTS_PER_PAGE;
    expect(getAdsterraMaxSlotsPerPage()).toBe(3);
  });

  it("rejects duplicate keys on the same page", () => {
    expect(claimAdsterraSlot("key-a").ok).toBe(true);
    expect(claimAdsterraSlot("key-a").ok).toBe(false);
    expect(claimAdsterraSlot("key-a").reason).toBe("duplicate-key");
  });

  it("resets between pages", () => {
    expect(claimAdsterraSlot("key-a").ok).toBe(true);
    resetAdsterraPageRegistry();
    expect(claimAdsterraSlot("key-a").ok).toBe(true);
  });
});
