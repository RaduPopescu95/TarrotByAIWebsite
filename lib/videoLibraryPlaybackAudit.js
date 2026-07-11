const LOG_PREFIX = "[video-library-playback]";
const MAX_HEADER_LENGTH = 240;

function readHeader(req, name) {
  const value = req?.headers?.[name];
  const normalized = Array.isArray(value) ? value[0] : value;
  return typeof normalized === "string"
    ? normalized.trim().slice(0, MAX_HEADER_LENGTH) || null
    : null;
}

function inferPlatform(userAgent, explicitPlatform) {
  const explicit = typeof explicitPlatform === "string" ? explicitPlatform.toLowerCase() : "";
  if (explicit.includes("ios")) return "ios";
  if (explicit.includes("android")) return "android";

  const ua = typeof userAgent === "string" ? userAgent.toLowerCase() : "";
  if (/iphone|ipad|ipod|cfnetwork/.test(ua)) return "ios";
  if (/android|okhttp/.test(ua)) return "android";
  return "unknown";
}

function sanitizeUrlForLog(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, MAX_HEADER_LENGTH);
  } catch {
    return null;
  }
}

export function buildVideoRequestTelemetry(req) {
  const userAgent = readHeader(req, "user-agent");
  const explicitPlatform =
    readHeader(req, "x-app-platform") || readHeader(req, "x-platform");

  return {
    inferredPlatform: inferPlatform(userAgent, explicitPlatform),
    explicitPlatform,
    appVersion:
      readHeader(req, "x-app-version") ||
      readHeader(req, "x-client-version") ||
      readHeader(req, "expo-version"),
    userAgent,
    acceptLanguage: readHeader(req, "accept-language"),
    referer: sanitizeUrlForLog(readHeader(req, "referer")),
    vercelId: readHeader(req, "x-vercel-id"),
    forwardedHost: readHeader(req, "x-forwarded-host"),
    hasAuthorizationHeader: Boolean(readHeader(req, "authorization")),
  };
}

export function summarizeVideoPlaybackDtos(videos) {
  const summary = {
    total: 0,
    bunny: 0,
    youtube: 0,
    vimeo: 0,
    otherPlatform: 0,
    playable: 0,
    locked: 0,
    missingEmbed: 0,
    missingHls: 0,
    bunnyMissingEmbed: 0,
    bunnyMissingHls: 0,
    invalidSource: 0,
  };

  if (!Array.isArray(videos)) return summary;
  videos.forEach((video) => {
    summary.total += 1;
    if (video?.platform === "bunny") summary.bunny += 1;
    else if (video?.platform === "youtube") summary.youtube += 1;
    else if (video?.platform === "vimeo") summary.vimeo += 1;
    else summary.otherPlatform += 1;

    if (video?.canPlay === true) summary.playable += 1;
    else summary.locked += 1;
    if (!video?.embedSrc) summary.missingEmbed += 1;
    if (!video?.hlsSrc) summary.missingHls += 1;
    if (video?.lockedReason === "source_invalid") summary.invalidSource += 1;
    if (video?.platform === "bunny" && !video?.embedSrc) summary.bunnyMissingEmbed += 1;
    if (video?.platform === "bunny" && !video?.hlsSrc) summary.bunnyMissingHls += 1;
  });
  return summary;
}

export function auditVideoPlayback(stage, entry, level = "info") {
  const payload = {
    at: new Date().toISOString(),
    stage,
    ...entry,
  };
  if (level === "warn") {
    console.warn(`${LOG_PREFIX} ${stage}`, payload);
  } else if (level === "error") {
    console.error(`${LOG_PREFIX} ${stage}`, payload);
  } else {
    console.info(`${LOG_PREFIX} ${stage}`, payload);
  }
  return payload;
}
