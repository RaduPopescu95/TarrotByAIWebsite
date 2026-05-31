import { hasPremiumAccess } from "./premiumAccess";

/**
 * Client-side playback gate when CDN serves anonymous list/detail DTOs (canPlay=false for premium).
 */
export function isVideoPlayableForUser(video, userData) {
  if (!video || typeof video !== "object") return false;
  const embedSrc = typeof video.embedSrc === "string" ? video.embedSrc.trim() : "";
  if (!embedSrc) return false;
  if (video.canPlay === true) return true;
  if (video.isPremium === true && hasPremiumAccess(userData)) return true;
  return false;
}
