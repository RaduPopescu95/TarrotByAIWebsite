export function isIosCourseClient(platform, headerPlatform) {
  const body = String(platform || "").trim().toLowerCase();
  const header = String(headerPlatform || "").trim().toLowerCase();
  return body === "ios" || header === "ios";
}

export function shouldBlockIosCourseCheckout({
  platform,
  headerPlatform,
  iosCoursesHidden,
} = {}) {
  if (!isIosCourseClient(platform, headerPlatform)) return false;
  return iosCoursesHidden !== false;
}
