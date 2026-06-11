import { hasPremiumAccess } from "./premiumAccess";
import { explainPremiumAccess } from "./explainPremiumAccess";

/**
 * Client-side playback gate when CDN serves anonymous list/detail DTOs (canPlay=false for premium).
 */
export function isVideoPlayableForUser(video, userData) {
  if (!video || typeof video !== "object") return false;
  const embedSrc = typeof video.embedSrc === "string" ? video.embedSrc.trim() : "";
  if (!embedSrc) return false;
  if (video.canPlay === true) return true;
  const premiumUser = hasPremiumAccess(userData);
  if (video.isPremium === true && premiumUser) return true;

  if (video.isPremium === true && !premiumUser) {
    const explained = explainPremiumAccess(userData);
    console.warn("[premium-video-access] web_video_playback_denied", {
      videoId: video.id || null,
      videoCanPlay: video.canPlay === true,
      lockedReason: video.lockedReason || null,
      explained,
    });
  }

  return false;
}

export function auditWebVideoPlaybackGate(video, userData, extra = {}) {
  const explained = explainPremiumAccess(userData);
  const playable = isVideoPlayableForUser(video, userData);
  const mismatch =
    explained.hasAccess &&
    video?.isPremium === true &&
    video?.canPlay !== true &&
    !playable;

  const payload = {
    videoId: video?.id || null,
    videoIsPremium: video?.isPremium === true,
    videoCanPlay: video?.canPlay === true,
    lockedReason: video?.lockedReason || null,
    playable,
    explained,
    ...extra,
  };

  if (mismatch || (explained.hasAccess && !playable && video?.isPremium)) {
    console.warn("[premium-video-access] web_video_gate_mismatch", payload);
    return payload;
  }

  console.info("[premium-video-access] web_video_gate", payload);
  return payload;
}
