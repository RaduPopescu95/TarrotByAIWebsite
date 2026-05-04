import { normalizeLocale } from "./courses";
import { getAdminDb } from "./firebaseAdmin";
import {
  isVideoCreatedBeforePremiumSpotlightCutoff,
  rowHasValidEmbedForLocale,
} from "./videoLibraryPublic";
import {
  collectAndSortPublishedVideos,
  mapVideoRowToPublicDto,
} from "./videoLibraryPublicMapper";

const COLLECTION = "videosVideoModule";

/**
 * Published video library as public DTOs (same shape as GET /api/premium/video-library).
 *
 * @param {{ locale?: string; premiumActive: boolean; previewLimit?: number | null; premiumSpotlightOnly?: boolean }} opts
 * When previewLimit is a positive number, only that many clips are returned (same newest-first order as /videouri).
 */
export async function loadPremiumVideoLibraryVideos({
  locale,
  premiumActive,
  previewLimit = null,
  premiumSpotlightOnly = false,
}) {
  const db = getAdminDb();
  const localeNorm = normalizeLocale(typeof locale === "string" ? locale : undefined, "ro");
  const nowMs = Date.now();
  const snap = await db.collection(COLLECTION).get();
  const sorted = collectAndSortPublishedVideos(snap, nowMs);
  let playable = sorted.filter((row) => rowHasValidEmbedForLocale(row, localeNorm));

  if (premiumSpotlightOnly) {
    playable = playable.filter(
      (row) =>
        row.isPremium === true &&
        !isVideoCreatedBeforePremiumSpotlightCutoff(row),
    );
  }

  if (previewLimit != null && previewLimit > 0) {
    playable = playable.slice(0, previewLimit);
  }

  return playable.map((row) =>
    mapVideoRowToPublicDto(row, { locale: localeNorm, premiumActive })
  );
}
