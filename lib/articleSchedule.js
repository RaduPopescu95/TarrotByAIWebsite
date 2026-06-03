import moment from "moment-timezone";

export const ARTICLE_SCHEDULE_TIMEZONE = "Europe/Bucharest";

function parseDateParts(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const normalized = raw.replace(/[./]/g, "-");
  const parts = normalized.split("-");
  if (parts.length !== 3) return null;

  const nums = parts.map((part) => Number.parseInt(part, 10));
  if (nums.some((num) => !Number.isFinite(num))) return null;

  const [a, b, c] = nums;
  if (parts[0].length === 4) {
    return { year: a, month: b, day: c };
  }
  return { day: a, month: b, year: c };
}

function parseTimeParts(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const parts = raw.split(":");
  if (parts.length < 2) return null;

  const hour = Number.parseInt(parts[0], 10);
  const minute = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

export function toDateFromUnknown(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value?.toDate === "function") {
    const dateValue = value.toDate();
    return Number.isNaN(dateValue?.getTime?.()) ? null : dateValue;
  }
  if (typeof value === "string" || typeof value === "number") {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const dateValue = new Date(value.seconds * 1000);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  return null;
}

export function buildScheduledDate({
  dataProgramata,
  timpProgramat,
  fallbackDate = null,
  now = new Date(),
  timezone = ARTICLE_SCHEDULE_TIMEZONE,
} = {}) {
  const parsedDate = parseDateParts(dataProgramata);
  const parsedTime = parseTimeParts(timpProgramat);

  if (parsedDate) {
    const dateString = `${parsedDate.year}-${String(parsedDate.month).padStart(2, "0")}-${String(
      parsedDate.day
    ).padStart(2, "0")} ${String(parsedTime ? parsedTime.hour : 0).padStart(2, "0")}:${String(
      parsedTime ? parsedTime.minute : 0
    ).padStart(2, "0")}`;
    const timezoneMoment = moment.tz(dateString, "YYYY-MM-DD HH:mm", timezone);
    if (timezoneMoment.isValid()) return timezoneMoment.toDate();

    const dateValue = new Date(
      parsedDate.year,
      parsedDate.month - 1,
      parsedDate.day,
      parsedTime ? parsedTime.hour : 0,
      parsedTime ? parsedTime.minute : 0,
      0,
      0
    );
    if (!Number.isNaN(dateValue.getTime())) return dateValue;
  }

  const normalizedFallback = toDateFromUnknown(fallbackDate);
  if (normalizedFallback) return normalizedFallback;

  if (parsedTime) {
    const dateValue = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parsedTime.hour,
      parsedTime.minute,
      0,
      0
    );
    if (!Number.isNaN(dateValue.getTime())) return dateValue;
  }

  return toDateFromUnknown(now);
}

/** Do not send push for articles whose schedule is older than this window. */
export const ARTICLE_NOTIFICATION_MAX_AGE_MS = 72 * 60 * 60 * 1000;

export function shouldQueueArticlePushNotification(article, scheduledDate) {
  if (article?.notificationSentAt) {
    return false;
  }

  const scheduledMs = toDateFromUnknown(scheduledDate)?.getTime() ?? 0;
  if (!scheduledMs) {
    return false;
  }

  const now = Date.now();
  if (scheduledMs > now) {
    return true;
  }

  return scheduledMs >= now - ARTICLE_NOTIFICATION_MAX_AGE_MS;
}

export function resolveArticleScheduledAt(article, now = new Date()) {
  return buildScheduledDate({
    dataProgramata: article?.dataProgramata,
    timpProgramat: article?.timpProgramat,
    fallbackDate: article?.firstUploadTimestamp || article?.createdAt || null,
    now,
    timezone: ARTICLE_SCHEDULE_TIMEZONE,
  });
}
