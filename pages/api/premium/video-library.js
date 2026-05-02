import { getAdminDb } from "../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { hasPremiumAccess } from "../../../lib/premiumAccess";
import { normalizeLocale, readSingleQueryValue } from "../../../lib/courses";
import { rowHasValidEmbedForLocale } from "../../../lib/videoLibraryPublic";
import {
  collectAndSortPublishedVideos,
  mapVideoRowToPublicDto,
} from "../../../lib/videoLibraryPublicMapper";

const COLLECTION = "videosVideoModule";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;
  let premiumActive = false;

  try {
    const db = getAdminDb();
    if (uid) {
      const userSnap = await db.collection("Users").doc(uid).get();
      if (userSnap.exists) {
        premiumActive = hasPremiumAccess(userSnap.data() || {});
      }
    }

    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const nowMs = Date.now();
    const snap = await db.collection(COLLECTION).get();
    const sorted = collectAndSortPublishedVideos(snap, nowMs);
    const playable = sorted.filter((row) => rowHasValidEmbedForLocale(row, locale));

    const videos = playable.map((row) =>
      mapVideoRowToPublicDto(row, { locale, premiumActive })
    );

    return res.status(200).json({
      videos,
      locale,
      premiumActive,
      loggedIn: Boolean(uid),
    });
  } catch (error) {
    console.error("[premium.video-library] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load video library" });
  }
}
