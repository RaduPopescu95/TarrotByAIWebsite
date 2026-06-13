import { getOptionalAuth } from "../../../../lib/requireAuth";
import { normalizeLocale, readSingleQueryValue } from "../../../../lib/courses";
import { setDynamicPublicCacheHeaders } from "../../../../lib/httpCache";
import {
  firestoreTsToMillis,
  isVideoPublishScheduled,
  rowHasValidEmbedForLocale,
} from "../../../../lib/videoLibraryPublic";
import {
  loadPremiumVideoLibraryRowById,
  loadPremiumVideoRelatedRows,
} from "../../../../lib/loadPremiumVideoLibrary";
import { mapVideoRowToPublicDto } from "../../../../lib/videoLibraryPublicMapper";
import {
  resolvePublicVideoLibraryPremiumActive,
  resolveVideoLibraryPremiumAccessForUser,
} from "../../../../lib/videoLibraryAccess";
import {
  auditPremiumVideoAccess,
  buildClientAccessDebug,
} from "../../../../lib/premiumVideoAccessAudit";
import { isSubscriptionSystemEnabled } from "../../../../lib/globalSettings";
import { withFirestoreReadTelemetry } from "../../../../lib/firestoreCostLogger";

function buildRequestId() {
  return `vld_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const RELATED_LIMIT = 12;
const INTERNAL_VIDEO_DOC_IDS = new Set(["_meta", "_publicCache"]);

// eslint-disable-next-line global-require, import/no-dynamic-require
const nextI18nRoot = require("../../../../next-i18next.config.js");
const SITE_LOCALES =
  Array.isArray(nextI18nRoot.i18n?.locales) && nextI18nRoot.i18n.locales.length > 0
    ? nextI18nRoot.i18n.locales
    : ["ro"];

async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const rawId = typeof req.query.videoId === "string" ? req.query.videoId.trim() : "";
  if (!rawId || INTERNAL_VIDEO_DOC_IDS.has(rawId)) {
    return res.status(404).json({ error: "Not found" });
  }

  const hasAuthHeader = typeof req.headers?.authorization === "string" && req.headers.authorization.trim() !== "";
  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;

  try {
    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const subscriptionSystemEnabled = await isSubscriptionSystemEnabled();
    let premiumActive = false;
    let accessExplain = null;
    let userDocExists = null;

    if (uid) {
      const resolved = await resolveVideoLibraryPremiumAccessForUser(uid, {
        stage: "video_library_detail",
        requestId,
        videoId: rawId,
      });
      premiumActive = resolved.premiumActive;
      accessExplain = resolved.accessExplain;
      userDocExists = resolved.userDocExists;
    } else if (hasAuthHeader) {
      premiumActive = false;
      accessExplain = {
        hasAccess: false,
        reason: "auth_token_invalid_or_expired",
        snapshot: null,
        now: new Date().toISOString(),
      };
    } else {
      premiumActive = await resolvePublicVideoLibraryPremiumActive();
    }

    const nowMs = Date.now();
    const targetRow = await loadPremiumVideoLibraryRowById(rawId);
    if (!targetRow || isVideoPublishScheduled(targetRow.publishAt, nowMs)) {
      return res.status(404).json({ error: "Not found" });
    }

    const availableLocales = SITE_LOCALES.filter((lc) => rowHasValidEmbedForLocale(targetRow, lc));

    if (!rowHasValidEmbedForLocale(targetRow, locale)) {
      return res.status(404).json({ error: "Not found" });
    }

    const ctx = { locale, premiumActive };
    const video = mapVideoRowToPublicDto(targetRow, ctx);

    const catTrim = typeof video.category === "string" ? video.category.trim() : "";
    const relatedRows = catTrim
      ? await loadPremiumVideoRelatedRows({
          category: catTrim,
          excludeId: rawId,
          locale,
          limit: RELATED_LIMIT,
          nowMs,
        })
      : [];
    const related = relatedRows.map((row) => mapVideoRowToPublicDto(row, ctx));

    let cacheTtlSec = 0;
    if (uid || hasAuthHeader) {
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
    } else {
      const targetPublishMs = firestoreTsToMillis(targetRow?.publishAt);
      const nextPublishAtMs =
        Number.isFinite(targetPublishMs) && targetPublishMs > nowMs ? targetPublishMs : null;
      const cacheMeta = setDynamicPublicCacheHeaders(res, {
        nowMs,
        nextPublishAtMs,
        maxAgeSeconds: 300,
        staleWhileRevalidateSeconds: 600,
      });
      cacheTtlSec = cacheMeta.cacheTtlSec;
    }

    const mismatch =
      video?.isPremium === true &&
      premiumActive === true &&
      video?.canPlay !== true;

    auditPremiumVideoAccess({
      stage: "video_library_detail_response",
      level: mismatch ? "warn" : "info",
      requestId,
      uid: uid || null,
      videoId: rawId,
      premiumActive,
      subscriptionSystemEnabled,
      hasAccess: accessExplain?.hasAccess,
      accessReason: accessExplain?.reason || null,
      accessSnapshot: accessExplain?.snapshot || null,
      userDocExists,
      hasAuthHeader,
      videoIsPremium: video?.isPremium === true,
      videoCanPlay: video?.canPlay === true,
      videoLockedReason: video?.lockedReason || null,
      mismatch: mismatch ? "premium_user_but_video_dto_locked" : null,
      locale,
    });

    return res.status(200).json({
      video,
      related,
      locale,
      availableLocales,
      premiumActive,
      loggedIn: Boolean(uid),
      generatedAt: new Date(nowMs).toISOString(),
      cacheTtlSec,
      requestId,
      accessDebug: uid || hasAuthHeader
        ? buildClientAccessDebug(accessExplain, {
            userDocExists,
            hasAuthHeader,
            subscriptionSystemEnabled,
            videoId: rawId,
            videoIsPremium: video?.isPremium === true,
            videoCanPlay: video?.canPlay === true,
            videoLockedReason: video?.lockedReason || null,
          })
        : undefined,
    });
  } catch (error) {
    console.error("[premium.video-library.detail] failed", {
      requestId,
      message: error?.message || error,
      videoId: rawId,
      uid: uid || null,
    });
    return res.status(500).json({ error: "Failed to load video", requestId });
  }
}

export default withFirestoreReadTelemetry("/api/premium/video-library/[videoId]", handler);
