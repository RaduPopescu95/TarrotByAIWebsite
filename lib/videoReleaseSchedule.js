import moment from "moment-timezone";

export const VIDEO_RELEASE_TIMEZONE = "Europe/Bucharest";
export const VIDEO_PUBLIC_RELEASE_HOUR = 18;

export const VIDEO_ACCESS_MODE_FREE = "free";
export const VIDEO_ACCESS_MODE_PREMIUM = "premium";
export const VIDEO_ACCESS_MODE_DUAL = "dual";

function timestampToMillis(value) {
  if (!value) return null;
  try {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    if (typeof value._seconds === "number") return value._seconds * 1000;
    if (value instanceof Date) return value.getTime();
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value).getTime();
      return Number.isFinite(parsed) ? parsed : null;
    }
  } catch (_) {}
  return null;
}

export function buildVideoPublicReleaseDate(
  dateValue,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  if (typeof dateValue !== "string" || !dateValue.trim()) return null;
  const release = moment.tz(
    `${dateValue.trim()} ${String(VIDEO_PUBLIC_RELEASE_HOUR).padStart(2, "0")}:00`,
    "YYYY-MM-DD HH:mm",
    true,
    timezone
  );
  return release.isValid() ? release.toDate() : null;
}

export function formatVideoPublicReleaseDateInput(
  value,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  const millis = timestampToMillis(value);
  if (!Number.isFinite(millis)) return "";
  return moment.tz(millis, timezone).format("YYYY-MM-DD");
}

export function resolveVideoAccessMode(video) {
  if (timestampToMillis(video?.publicReleaseAt) != null) {
    return VIDEO_ACCESS_MODE_DUAL;
  }
  return video?.isPremium === true
    ? VIDEO_ACCESS_MODE_PREMIUM
    : VIDEO_ACCESS_MODE_FREE;
}

export function resolveVideoReleasePhase(video, nowMs = Date.now()) {
  const publishAtMs = timestampToMillis(video?.publishAt);
  const publicReleaseAtMs = timestampToMillis(video?.publicReleaseAt);
  const hasDualRelease = Number.isFinite(publicReleaseAtMs);

  if (Number.isFinite(publishAtMs) && publishAtMs > nowMs) {
    return {
      phase: "scheduled",
      visible: false,
      requiresPremium: video?.isPremium === true,
      hasDualRelease,
      publishAtMs,
      publicReleaseAtMs,
    };
  }

  if (hasDualRelease && publicReleaseAtMs > nowMs) {
    return {
      phase: "premium_early_access",
      visible: true,
      requiresPremium: true,
      hasDualRelease: true,
      publishAtMs,
      publicReleaseAtMs,
    };
  }

  return {
    phase: hasDualRelease ? "public" : video?.isPremium === true ? "premium" : "public",
    visible: true,
    requiresPremium: hasDualRelease ? false : video?.isPremium === true,
    hasDualRelease,
    publishAtMs,
    publicReleaseAtMs,
  };
}

export function canViewerSeeVideo(video, premiumActive, nowMs = Date.now()) {
  const release = resolveVideoReleasePhase(video, nowMs);
  if (!release.visible) return false;
  if (release.phase === "premium_early_access" && premiumActive !== true) {
    return false;
  }
  return true;
}

export function resolveVideoNotificationAt(video) {
  return video?.publicReleaseAt ?? video?.publishAt ?? null;
}

export function getNextVideoTransitionAtMs(rows, nowMs = Date.now()) {
  let nextValue = null;
  for (const row of Array.isArray(rows) ? rows : []) {
    for (const value of [row?.publishAt, row?.publicReleaseAt]) {
      const millis = timestampToMillis(value);
      if (!Number.isFinite(millis) || millis <= nowMs) continue;
      if (nextValue == null || millis < nextValue) {
        nextValue = millis;
      }
    }
  }
  return nextValue;
}
