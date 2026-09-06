import {
  isIosCourseClient,
  shouldBlockIosCourseCheckout,
} from "../iosCoursesVisibility";

describe("iosCoursesVisibility", () => {
  test("detects iOS from body platform or client header", () => {
    expect(isIosCourseClient("ios", "")).toBe(true);
    expect(isIosCourseClient("expo", "ios")).toBe(true);
    expect(isIosCourseClient("expo", "android")).toBe(false);
    expect(isIosCourseClient("web", "")).toBe(false);
  });

  test("blocks iOS checkout unless hiding is explicitly disabled", () => {
    expect(
      shouldBlockIosCourseCheckout({
        platform: "ios",
        iosCoursesHidden: true,
      })
    ).toBe(true);
    expect(
      shouldBlockIosCourseCheckout({
        platform: "expo",
        headerPlatform: "ios",
        iosCoursesHidden: undefined,
      })
    ).toBe(true);
    expect(
      shouldBlockIosCourseCheckout({
        platform: "ios",
        iosCoursesHidden: false,
      })
    ).toBe(false);
    expect(
      shouldBlockIosCourseCheckout({
        platform: "expo",
        headerPlatform: "android",
        iosCoursesHidden: true,
      })
    ).toBe(false);
  });

});
