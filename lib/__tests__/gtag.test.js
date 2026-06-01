const originalEnv = process.env;

describe("gtag helpers", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("shouldTrackPath excludes dashboard and api routes", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST";
    const { shouldTrackPath } = await import("../gtag");

    expect(shouldTrackPath("/")).toBe(true);
    expect(shouldTrackPath("/news/foo")).toBe(true);
    expect(shouldTrackPath("/dashboard/setari")).toBe(false);
    expect(shouldTrackPath("/api/mobile/me")).toBe(false);
  });

  it("isGaEnabled requires production and measurement id", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_GA_ENABLED = "true";

    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "";
    jest.resetModules();
    let mod = await import("../gtag");
    expect(mod.isGaEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST";
    jest.resetModules();
    mod = await import("../gtag");
    expect(mod.isGaEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_GA_ENABLED = "false";
    jest.resetModules();
    mod = await import("../gtag");
    expect(mod.isGaEnabled()).toBe(false);
  });
});
