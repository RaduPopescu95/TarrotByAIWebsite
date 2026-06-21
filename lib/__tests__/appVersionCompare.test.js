import {
  compareAppVersions,
  normalizeAppVersion,
} from "../appVersionCompare";

describe("appVersionCompare", () => {
  it("normalizes valid semver-like versions", () => {
    expect(normalizeAppVersion(" 2.3.0 ")).toBe("2.3.0");
    expect(normalizeAppVersion("2")).toBe("2");
    expect(normalizeAppVersion("2.3")).toBe("2.3");
  });

  it("rejects invalid versions", () => {
    expect(normalizeAppVersion("")).toBeNull();
    expect(normalizeAppVersion("v2.3.0")).toBeNull();
    expect(normalizeAppVersion("2.3.0-beta")).toBeNull();
    expect(normalizeAppVersion(null)).toBeNull();
  });

  it("compares versions numerically", () => {
    expect(compareAppVersions("2.3.0", "2.2.9")).toBe(1);
    expect(compareAppVersions("2.2.9", "2.3.0")).toBe(-1);
    expect(compareAppVersions("2.3.0", "2.3.0")).toBe(0);
    expect(compareAppVersions("2.3", "2.3.0")).toBe(0);
    expect(compareAppVersions("2.10.0", "2.9.0")).toBe(1);
  });
});
