import moment from "moment-timezone";

export const VIDEO_RELEASE_TIMEZONE = "Europe/Bucharest";
export const VIDEO_PUBLIC_RELEASE_DEFAULT_TIME = "18:00";

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
  timeValue = VIDEO_PUBLIC_RELEASE_DEFAULT_TIME,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  if (typeof dateValue !== "string" || typeof timeValue !== "string") return null;
  const normalizedDate = dateValue.trim();
  const normalizedTime = timeValue.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return null;
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) return null;
  if (!moment.tz.zone(timezone)) return null;

  const localInput = `${normalizedDate} ${normalizedTime}`;
  const release = moment.tz(
    localInput,
    "YYYY-MM-DD HH:mm",
    true,
    timezone
  );
  if (!release.isValid()) return null;

  // Moment normalizes nonexistent spring-forward times (for example 03:30 to
  // 04:30). Reject that normalization so the administrator must choose a real
  // Europe/Bucharest wall-clock time. Ambiguous fall-back times retain Moment's
  // existing policy: the first occurrence is selected.
  if (release.format("YYYY-MM-DD HH:mm") !== localInput) return null;
  return release.seconds(0).milliseconds(0).toDate();
}

export function getVideoPublicReleaseInputs(
  value,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  const millis = timestampToMillis(value);
  if (!Number.isFinite(millis) || !moment.tz.zone(timezone)) {
    return { date: "", time: VIDEO_PUBLIC_RELEASE_DEFAULT_TIME };
  }
  const local = moment.tz(millis, timezone);
  return {
    date: local.format("YYYY-MM-DD"),
    time: local.format("HH:mm"),
  };
}

export function formatVideoPublicReleaseDateInput(
  value,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  return getVideoPublicReleaseInputs(value, timezone).date;
}

export function formatVideoPublicReleaseTimeInput(
  value,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  return getVideoPublicReleaseInputs(value, timezone).time;
}

export function formatVideoPublicReleaseMoment(
  value,
  timezone = VIDEO_RELEASE_TIMEZONE
) {
  const millis = timestampToMillis(value);
  if (!Number.isFinite(millis) || !moment.tz.zone(timezone)) return "—";
  return `${moment.tz(millis, timezone).format("DD.MM.YYYY, HH:mm")} (${timezone})`;
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
