import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { getOptionalAuth } from "../../../../lib/requireAuth";
import { hasPremiumAccess } from "../../../../lib/premiumAccess";
import { normalizeLocale, readSingleQueryValue } from "../../../../lib/courses";
import {
  collectAndSortPublishedVideos,
  mapVideoRowToPublicDto,
} from "../../../../lib/videoLibraryPublicMapper";

const COLLECTION = "videosVideoModule";
const RELATED_LIMIT = 12;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  const rawId = typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
  if (!rawId || rawId === "_meta") {
    return res.status(404).json({ error: "Not found" });
  }

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
    const sortedRows = collectAndSortPublishedVideos(snap, nowMs);

    const targetRow = sortedRows.find((r) => r.id === rawId);
    if (!targetRow) {
      return res.status(404).json({ error: "Not found" });
    }

    const ctx = { locale, premiumActive };
    const video = mapVideoRowToPublicDto(targetRow, ctx);

    /** Same trim(category) match only; empty category yields no related (plan). */
    const catTrim = typeof video.category === "string" ? video.category.trim() : "";
    let relatedRows;
    if (!catTrim) {
      relatedRows = [];
    } else {
      relatedRows = sortedRows.filter((r) => {
        if (r.id === rawId) return false;
        const c = typeof r.category === "string" ? r.category.trim() : "";
        return c === catTrim;
      });
    }

    const related = relatedRows
      .slice(0, RELATED_LIMIT)
      .map((row) => mapVideoRowToPublicDto(row, ctx));

    return res.status(200).json({
      video,
      related,
      locale,
      premiumActive,
      loggedIn: Boolean(uid),
    });
  } catch (error) {
    console.error("[premium.video-library.detail] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load video" });
  }
}
