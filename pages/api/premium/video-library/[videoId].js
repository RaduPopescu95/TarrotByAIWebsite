import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { isSubscriptionSystemEnabled } from "../../../../lib/globalSettings";
import { getOptionalAuth } from "../../../../lib/requireAuth";
import { hasPremiumAccess } from "../../../../lib/premiumAccess";
import { normalizeLocale, readSingleQueryValue } from "../../../../lib/courses";
import {
  isVideoPublishScheduled,
  rowHasValidEmbedForLocale,
} from "../../../../lib/videoLibraryPublic";
import { loadPremiumVideoLibraryRows } from "../../../../lib/loadPremiumVideoLibrary";
import { mapVideoRowToPublicDto } from "../../../../lib/videoLibraryPublicMapper";

const RELATED_LIMIT = 12;
const INTERNAL_VIDEO_DOC_IDS = new Set(["_meta", "_publicCache"]);

// eslint-disable-next-line global-require, import/no-dynamic-require
const nextI18nRoot = require("../../../../next-i18next.config.js");
const SITE_LOCALES =
  Array.isArray(nextI18nRoot.i18n?.locales) && nextI18nRoot.i18n.locales.length > 0
    ? nextI18nRoot.i18n.locales
    : ["ro"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawId = typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
  if (!rawId || INTERNAL_VIDEO_DOC_IDS.has(rawId)) {
    return res.status(404).json({ error: "Not found" });
  }

  const hasAuthHeader = typeof req.headers?.authorization === "string" && req.headers.authorization.trim() !== "";
  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;
  let premiumActive = false;

  if (uid || hasAuthHeader) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  }

  try {
    const db = getAdminDb();
    if (uid) {
      const userSnap = await db.collection("Users").doc(uid).get();
      if (userSnap.exists) {
        premiumActive = hasPremiumAccess(userSnap.data() || {});
      }
    }

    const clientRaw = readSingleQueryValue(req.query.client);
    const isWebClient =
      typeof clientRaw === "string" && clientRaw.trim().toLowerCase() === "web";
    const subscriptionEnabled = await isSubscriptionSystemEnabled();
    if (!subscriptionEnabled && !isWebClient) {
      premiumActive = true;
    }

    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const nowMs = Date.now();
    const sortedRows = await loadPremiumVideoLibraryRows();
    const targetRow = sortedRows.find((r) => r.id === rawId);
    if (!targetRow || isVideoPublishScheduled(targetRow.publishAt, nowMs)) {
      return res.status(404).json({ error: "Not found" });
    }

    const availableLocales = SITE_LOCALES.filter((lc) => rowHasValidEmbedForLocale(targetRow, lc));

    if (!rowHasValidEmbedForLocale(targetRow, locale)) {
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
        if (isVideoPublishScheduled(r.publishAt, nowMs)) return false;
        const c = typeof r.category === "string" ? r.category.trim() : "";
        return c === catTrim && rowHasValidEmbedForLocale(r, locale);
      });
    }

    const related = relatedRows.slice(0, RELATED_LIMIT).map((row) => mapVideoRowToPublicDto(row, ctx));

    return res.status(200).json({
      video,
      related,
      locale,
      availableLocales,
      premiumActive,
      loggedIn: Boolean(uid),
    });
  } catch (error) {
    console.error("[premium.video-library.detail] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load video" });
  }
}
