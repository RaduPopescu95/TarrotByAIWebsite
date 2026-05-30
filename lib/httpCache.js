const DEFAULT_S_MAXAGE_SECONDS = 60;
const DEFAULT_STALE_WHILE_REVALIDATE_SECONDS = 60;

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function computeDynamicSMaxAgeSeconds({
  nowMs = Date.now(),
  nextPublishAtMs = null,
  maxAgeSeconds = DEFAULT_S_MAXAGE_SECONDS,
} = {}) {
  const maxAge = Math.max(1, Number.parseInt(String(maxAgeSeconds), 10) || DEFAULT_S_MAXAGE_SECONDS);
  const nextPublish = toFiniteNumber(nextPublishAtMs);
  if (nextPublish == null || nextPublish <= nowMs) {
    return maxAge;
  }

  const secondsUntilNext = Math.ceil((nextPublish - nowMs) / 1000);
  if (!Number.isFinite(secondsUntilNext) || secondsUntilNext <= 0) {
    return 1;
  }

  return Math.max(1, Math.min(maxAge, secondsUntilNext));
}

export function buildPublicCacheControl({
  sMaxageSeconds = DEFAULT_S_MAXAGE_SECONDS,
  staleWhileRevalidateSeconds = DEFAULT_STALE_WHILE_REVALIDATE_SECONDS,
} = {}) {
  const sMaxage = Math.max(1, Number.parseInt(String(sMaxageSeconds), 10) || DEFAULT_S_MAXAGE_SECONDS);
  const swr = Math.max(
    0,
    Number.parseInt(String(staleWhileRevalidateSeconds), 10) || DEFAULT_STALE_WHILE_REVALIDATE_SECONDS
  );
  return `public, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`;
}

export function setDynamicPublicCacheHeaders(
  res,
  {
    nowMs = Date.now(),
    nextPublishAtMs = null,
    maxAgeSeconds = DEFAULT_S_MAXAGE_SECONDS,
    staleWhileRevalidateSeconds = DEFAULT_STALE_WHILE_REVALIDATE_SECONDS,
  } = {}
) {
  const sMaxageSeconds = computeDynamicSMaxAgeSeconds({
    nowMs,
    nextPublishAtMs,
    maxAgeSeconds,
  });
  const cacheControl = buildPublicCacheControl({
    sMaxageSeconds,
    staleWhileRevalidateSeconds,
  });
  res.setHeader("Cache-Control", cacheControl);
  return {
    cacheControl,
    cacheTtlSec: sMaxageSeconds,
    sMaxageSeconds,
    staleWhileRevalidateSeconds,
  };
}

