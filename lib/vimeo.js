import { extractVimeoId } from "./courses";

const OEMBED_ENDPOINT = "https://vimeo.com/api/oembed.json";
const PREVIEW_TIMEOUT_MS = 5000;

function normalizeThumbnail(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchVimeoPreviewThumbnail(vimeoUrl) {
  const vimeoId = extractVimeoId(vimeoUrl);
  if (!vimeoId) {
    console.warn("[courses.preview] fetch_fail", {
      reason: "invalid_vimeo_url",
    });
    return null;
  }

  const previewUrl = `https://vimeo.com/${vimeoId}`;
  const requestUrl = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(previewUrl)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);

  console.info("[courses.preview] fetch_start", {
    vimeoId,
  });

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`oembed_status_${response.status}`);
    }

    const payload = await response.json();
    const thumbnailUrl = normalizeThumbnail(payload?.thumbnail_url);

    if (!thumbnailUrl) {
      console.warn("[courses.preview] fetch_fail", {
        vimeoId,
        reason: "missing_thumbnail",
      });
      return null;
    }

    console.info("[courses.preview] fetch_success", {
      vimeoId,
    });
    return thumbnailUrl;
  } catch (error) {
    console.error("[courses.preview] fetch_fail", {
      vimeoId,
      message: error?.message || "unknown_error",
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
