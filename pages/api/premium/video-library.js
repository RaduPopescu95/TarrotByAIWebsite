import { normalizeLocale, readSingleQueryValue } from "../../../lib/courses";
import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import { loadPremiumVideoLibraryRows, loadPremiumVideoLibraryVideos } from "../../../lib/loadPremiumVideoLibrary";
import { getOptionalAuth } from "../../../lib/requireAuth";
import { getNextVideoTransitionAtMs } from "../../../lib/videoReleaseSchedule";
import {
  resolvePublicVideoLibraryPremiumActive,
  resolveVideoLibraryPremiumAccessForUser,
} from "../../../lib/videoLibraryAccess";
import {
  auditVideoLibraryResponse,
  buildClientAccessDebug,
} from "../../../lib/premiumVideoAccessAudit";
import { isSubscriptionSystemEnabled } from "../../../lib/globalSettings";
import { withFirestoreReadTelemetry } from "../../../lib/firestoreCostLogger";

function buildRequestId() {
  return `vl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  const decoded = await getOptionalAuth(req);
  const uid = decoded?.uid || null;

  try {
    const localeRaw = readSingleQueryValue(req.query.locale);
    const locale = normalizeLocale(
      typeof localeRaw === "string" ? localeRaw : undefined,
      "ro"
    );

    const scopeRaw = readSingleQueryValue(req.query.scope);
    const premiumSpotlightOnly = scopeRaw === "premium_zone";

    const clientRaw = readSingleQueryValue(req.query.client);
    const webClient =
      typeof clientRaw === "string" && clientRaw.trim().toLowerCase() === "web";

    const hasAuthHeader =
      typeof req.headers?.authorization === "string" && req.headers.authorization.trim() !== "";
    const subscriptionSystemEnabled = await isSubscriptionSystemEnabled();

    let premiumActive = false;
    let accessExplain = null;
    let userDocExists = null;

    if (uid) {
      const resolved = await resolveVideoLibraryPremiumAccessForUser(uid, {
        stage: "video_library_list",
        requestId,
      });
      premiumActive = resolved.premiumActive;
      accessExplain = resolved.accessExplain;
      userDocExists = resolved.userDocExists;
    } else {
      premiumActive = await resolvePublicVideoLibraryPremiumActive();
      if (hasAuthHeader && !uid) {
        accessExplain = {
          hasAccess: false,
          reason: "auth_token_invalid_or_expired",
          snapshot: null,
          now: new Date().toISOString(),
        };
      }
    }

    const [videos, rowsForMeta] = await Promise.all([
      loadPremiumVideoLibraryVideos({
        locale,
        premiumActive,
        premiumSpotlightOnly,
        webClient,
      }),
      loadPremiumVideoLibraryRows(),
    ]);

    const nowMs = Date.now();
    let cacheMeta = { cacheTtlSec: 0 };
    if (uid) {
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
    } else {
      const nextVideoTransitionAtMs = getNextVideoTransitionAtMs(
        rowsForMeta,
        nowMs
      );
      cacheMeta = setDynamicPublicCacheHeaders(res, {
        nowMs,
        nextPublishAtMs: nextVideoTransitionAtMs,
        maxAgeSeconds: 300,
        staleWhileRevalidateSeconds:
          nextVideoTransitionAtMs != null ? 0 : 600,
      });
    }

    auditVideoLibraryResponse({
      stage: "video_library_list_response",
      requestId,
      uid,
      premiumActive,
      subscriptionSystemEnabled,
      accessExplain,
      videos,
      extra: {
        locale,
        scope: scopeRaw || null,
        hasAuthHeader,
        userDocExists,
        loggedIn: Boolean(uid),
      },
    });

    const responsePayload = {
      videos,
      locale,
      premiumActive,
      loggedIn: Boolean(uid),
      generatedAt: new Date(nowMs).toISOString(),
      cacheTtlSec: cacheMeta.cacheTtlSec,
      requestId,
      accessDebug: uid
        ? buildClientAccessDebug(accessExplain, {
            userDocExists,
            hasAuthHeader,
            subscriptionSystemEnabled,
          })
        : hasAuthHeader
          ? buildClientAccessDebug(accessExplain, {
              hasAuthHeader: true,
              subscriptionSystemEnabled,
            })
          : undefined,
    };
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("[premium.video-library] failed", {
      requestId,
      message: error?.message || String(error),
      stackTop: typeof error?.stack === "string" ? error.stack.split("\n").slice(0, 3).join(" | ") : null,
      uid: uid || null,
      query: req.query || {},
    });
    return res.status(500).json({ error: "Failed to load video library", requestId });
  }
}

export default withFirestoreReadTelemetry("/api/premium/video-library", handler);
