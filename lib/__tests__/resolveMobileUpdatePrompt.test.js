import {
  compareAppVersions,
  normalizeAppVersion,
  resolveMobileUpdatePrompt,
} from "../mobileUpdatePromptSettings";

describe("resolveMobileUpdatePrompt", () => {
  it("returns off when both flags are disabled", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: false,
        forceUpdate: false,
        platform: "ios",
        appVersion: "2.2.9",
        minAppVersionIos: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: false, forceUpdate: false });
  });

  it("returns raw flags when platform is missing", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: false,
        forceUpdate: true,
        appVersion: "2.3.0",
        minAppVersionIos: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: true, forceUpdate: true });
  });

  it("hides prompt when app version meets minimum", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: true,
        platform: "ios",
        appVersion: "2.3.0",
        minAppVersionIos: "2.3.0",
        minAppVersionAndroid: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: false, forceUpdate: false });
  });

  it("shows force prompt when app version is below minimum", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: true,
        platform: "android",
        appVersion: "2.2.9",
        minAppVersionIos: "2.3.0",
        minAppVersionAndroid: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: true, forceUpdate: true });
  });

  it("hides prompt when ios app version is above minimum", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: true,
        platform: "ios",
        appVersion: "2.4.0",
        minAppVersionIos: "2.3.0",
        minAppVersionAndroid: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: false, forceUpdate: false });
  });

  it("shows soft update when below minimum and force is off", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: false,
        platform: "ios",
        appVersion: "2.2.9",
        minAppVersionIos: "2.3.0",
        minAppVersionAndroid: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: true, forceUpdate: false });
  });

  it("hides soft update when app version meets minimum", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: false,
        platform: "android",
        appVersion: "2.3.0",
        minAppVersionIos: "2.3.0",
        minAppVersionAndroid: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: false, forceUpdate: false });
  });

  it("treats missing appVersion as outdated", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: true,
        platform: "ios",
        minAppVersionIos: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: true, forceUpdate: true });
  });

  it("does not force update when minimum is missing for platform", () => {
    expect(
      resolveMobileUpdatePrompt({
        update: true,
        forceUpdate: true,
        platform: "ios",
        appVersion: "2.2.9",
        minAppVersionAndroid: "2.3.0",
      })
    ).toEqual({ showUpdatePrompt: false, forceUpdate: false });
  });
});

describe("normalizeAppVersion re-export", () => {
  it("is available from mobileUpdatePromptSettings", () => {
    expect(normalizeAppVersion("1.0.0")).toBe("1.0.0");
    expect(compareAppVersions("1.0.0", "1.0.1")).toBe(-1);
  });
});
