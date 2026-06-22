jest.mock("../mobileUpdatePromptSettings", () => ({
  loadMobileUpdateStatus: jest.fn(),
  normalizeAppVersion: jest.requireActual("../mobileUpdatePromptSettings")
    .normalizeAppVersion,
  normalizeMobilePlatform: jest.requireActual("../mobileUpdatePromptSettings")
    .normalizeMobilePlatform,
  compareAppVersions: jest.requireActual("../mobileUpdatePromptSettings")
    .compareAppVersions,
}));

import { loadMobileUpdateStatus } from "../mobileUpdatePromptSettings";
import {
  readMobileClientFromRequest,
  resolveCourseMediaClientBlock,
} from "../courseMobileClientGuard";

describe("courseMobileClientGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("readMobileClientFromRequest parses Expo mobile headers", () => {
    const client = readMobileClientFromRequest({
      headers: {
        "x-app-client": "expo-mobile",
        "x-app-platform": "ios",
        "x-app-version": "2.2.0",
      },
    });

    expect(client).toEqual({
      platform: "ios",
      appVersion: "2.2.0",
      clientId: "expo-mobile",
      isExpoMobile: true,
      isMobilePlatform: true,
    });
  });

  test("does not block web clients without mobile headers", async () => {
    loadMobileUpdateStatus.mockResolvedValue({
      forceUpdate: true,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });

    await expect(resolveCourseMediaClientBlock({ headers: {} })).resolves.toBeNull();
  });

  test("blocks legacy Expo iOS below configured minimum when force update is on", async () => {
    loadMobileUpdateStatus.mockResolvedValue({
      forceUpdate: true,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });

    const block = await resolveCourseMediaClientBlock({
      headers: {
        "x-app-client": "expo-mobile",
        "x-app-platform": "ios",
        "x-app-version": "2.2.0",
      },
    });

    expect(block).toEqual({
      status: 403,
      body: {
        error: "app_update_required",
        message: "Please update the app to access purchased course content.",
        minAppVersion: "2.3.0",
        platform: "ios",
      },
    });
  });

  test("allows current Expo iOS at or above configured minimum", async () => {
    loadMobileUpdateStatus.mockResolvedValue({
      forceUpdate: true,
      minAppVersionIos: "2.3.0",
      minAppVersionAndroid: "2.3.0",
    });

    await expect(
      resolveCourseMediaClientBlock({
        headers: {
          "x-app-client": "expo-mobile",
          "x-app-platform": "ios",
          "x-app-version": "2.3.0",
        },
      })
    ).resolves.toBeNull();
  });
});
