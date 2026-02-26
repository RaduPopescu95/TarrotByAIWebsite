export const ELAI_LANGUAGES = [
  "ro",
  "en",
  "es",
  "it",
  "pl",
  "de",
  "hu",
  "cs",
  "sk",
  "hr",
  "ru",
  "bg",
  "el",
  "fr",
];

const READY_STATUSES = new Set([
  "ready",
  "finished",
  "completed",
  "done",
  "rendered",
  "success",
]);

const RENDERING_STATUSES = new Set([
  "rendering",
  "processing",
  "queued",
  "queue",
  "pending",
  "in_progress",
  "in-progress",
  "started",
]);

const ERROR_STATUSES = new Set(["error", "failed", "video_error", "render_error"]);

function toStringSafe(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function normalizeElaiStatus(value) {
  const raw = toStringSafe(value).trim().toLowerCase();
  if (!raw) return "unknown";
  if (raw === "draft") return "draft";
  if (READY_STATUSES.has(raw)) return "ready";
  if (RENDERING_STATUSES.has(raw)) return "rendering";
  if (ERROR_STATUSES.has(raw)) return "error";
  return "unknown";
}

export function extractElaiErrorMessage(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value?.message === "string") return value.message.trim();
  if (typeof value?.error === "string") return value.error.trim();
  try {
    return JSON.stringify(value);
  } catch (_) {
    return String(value);
  }
}

function readNestedValue(object, path) {
  if (!object || typeof object !== "object") return undefined;
  const parts = path.split(".");
  let current = object;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

function extractRawStatus(video = {}) {
  const candidates = [
    video?.status,
    video?.state,
    video?.renderStatus,
    video?.render_status,
    video?.videoStatus,
    video?.video_status,
    readNestedValue(video, "data.status"),
    readNestedValue(video, "render.status"),
    readNestedValue(video, "meta.status"),
  ];

  for (const candidate of candidates) {
    const value = toStringSafe(candidate).trim();
    if (value) return value;
  }
  return "";
}

function hasLikelyVideoFields(candidate) {
  if (!candidate || typeof candidate !== "object") return false;
  return Boolean(
    candidate?._id ||
      candidate?.id ||
      candidate?.status ||
      candidate?.state ||
      candidate?.url ||
      candidate?.videoUrl ||
      candidate?.video_url
  );
}

function unwrapElaiVideoPayload(video = {}) {
  const candidates = [
    video,
    video?.video,
    readNestedValue(video, "data.video"),
    readNestedValue(video, "result.video"),
    video?.data,
    video?.result,
  ];

  for (const candidate of candidates) {
    if (hasLikelyVideoFields(candidate)) return candidate;
  }

  return video;
}

function extractBestUrl(video = {}) {
  const candidates = [
    video?.url,
    video?.videoUrl,
    video?.video_url,
    video?.downloadUrl,
    video?.download_url,
    video?.link,
    readNestedValue(video, "data.url"),
    readNestedValue(video, "result.url"),
  ];

  for (const candidate of candidates) {
    const value = toStringSafe(candidate).trim();
    if (value) return value;
  }
  return "";
}

export function ensureElaiMeta(info = {}) {
  const normalizedStatus = normalizeElaiStatus(info.elaiStatus);
  return {
    video: toStringSafe(info.video),
    descriere: toStringSafe(info.descriere),
    _id: toStringSafe(info._id),
    url: toStringSafe(info.url),
    isRendering: normalizedStatus === "rendering",
    elaiStatus: normalizedStatus,
    elaiError: toStringSafe(info.elaiError),
    lastElaiSyncAt: toStringSafe(info.lastElaiSyncAt),
    lastRenderAttemptAt: toStringSafe(info.lastRenderAttemptAt),
    rerenderAttempts:
      Number.isFinite(Number(info.rerenderAttempts)) && Number(info.rerenderAttempts) >= 0
        ? Number(info.rerenderAttempts)
        : 0,
  };
}

export function createEmptyLanguageInfo() {
  return {
    video: "",
    descriere: "",
    _id: "",
    url: "",
    isRendering: false,
    elaiStatus: "unknown",
    elaiError: "",
    lastElaiSyncAt: "",
    lastRenderAttemptAt: "",
    rerenderAttempts: 0,
  };
}

export function createEmptyInfoMap() {
  return ELAI_LANGUAGES.reduce((acc, lang) => {
    acc[lang] = createEmptyLanguageInfo();
    return acc;
  }, {});
}

export function mapElaiVideoToLanguageInfo(video, previousInfo = {}, nowIso = new Date().toISOString()) {
  const previous = ensureElaiMeta(previousInfo);
  const source = unwrapElaiVideoPayload(video);
  const rawStatus = extractRawStatus(source);
  let status = normalizeElaiStatus(rawStatus);
  const resolvedUrl = extractBestUrl(source) || previous.url;

  // Some Elai responses can omit status while still returning a valid final URL.
  if (status === "unknown" && resolvedUrl) {
    status = "ready";
  }
  if (status === "unknown" && previous.elaiStatus && previous.elaiStatus !== "unknown") {
    status = previous.elaiStatus;
  }

  const errorMessage = extractElaiErrorMessage(source?.error || video?.error);
  const speech = source?.slides?.[0]?.speech;

  return {
    ...previous,
    video: typeof source?.name === "string" ? source.name : previous.video,
    descriere: typeof speech === "string" ? speech : previous.descriere,
    _id:
      typeof source?._id === "string"
        ? source._id
        : typeof source?.id === "string"
          ? source.id
          : previous._id,
    url: resolvedUrl,
    isRendering: status === "rendering",
    elaiStatus: status,
    elaiError: status === "error" ? errorMessage : "",
    lastElaiSyncAt: nowIso,
  };
}

export function computeRecordIsRendering(infoMap = {}) {
  return Object.values(infoMap || {}).some(
    (langInfo) => ensureElaiMeta(langInfo).elaiStatus === "rendering"
  );
}

export function normalizeVarianteRecord(record = {}) {
  const baseInfo = createEmptyInfoMap();
  const recordInfo = record?.info && typeof record.info === "object" ? record.info : {};

  for (const [lang, value] of Object.entries(recordInfo)) {
    baseInfo[lang] = ensureElaiMeta(value);
  }

  return {
    ...record,
    info: baseInfo,
    isRendering: computeRecordIsRendering(baseInfo),
  };
}

export function canRerenderElaiStatus(status) {
  const normalized = normalizeElaiStatus(status);
  return normalized === "draft" || normalized === "error";
}

export function isElaiReadyWithUrl(info = {}) {
  const normalized = ensureElaiMeta(info);
  return normalized.elaiStatus === "ready" && normalized.url.length > 0;
}

export function getElaiStatusLabel(info = {}) {
  const normalized = ensureElaiMeta(info);
  if (normalized.elaiStatus === "ready") {
    return normalized.url ? "Gata in Elai" : "Ready in Elai, fara URL";
  }
  if (normalized.elaiStatus === "rendering") return "Se renderizeaza in Elai";
  if (normalized.elaiStatus === "draft") return "Draft in Elai";
  if (normalized.elaiStatus === "error") {
    if (normalized.elaiError) return `Eroare Elai: ${normalized.elaiError}`;
    return "Eroare Elai";
  }
  return "Status Elai necunoscut";
}
