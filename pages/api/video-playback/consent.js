import { getOptionalAuth, omitFirebaseIdTokenFromPayload } from "../../../lib/requireAuth";
import {
  recordVideoPlaybackConsent,
  validateVideoPlaybackConsentBody,
} from "../../../lib/videoPlaybackConsentServer";

function buildRequestId() {
  return `vpc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const body = omitFirebaseIdTokenFromPayload(req.body || {});
    const validated = validateVideoPlaybackConsentBody(body);
    if (!validated.ok) {
      return res.status(validated.status).json({
        error: validated.error,
        requestId,
      });
    }

    const decoded = await getOptionalAuth(req);
    const authIdentity = {
      uid: decoded?.uid || null,
      email: decoded?.email || null,
    };

    const result = await recordVideoPlaybackConsent(req, validated.data, authIdentity);

    return res.status(200).json({
      ok: true,
      id: result.id,
      action: result.action,
      requestId,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    if (statusCode === 429) {
      return res.status(429).json({
        error: "Too many requests",
        requestId,
      });
    }
    console.error("[video-playback.consent] POST error", {
      requestId,
      message: error?.message || String(error),
    });
    return res.status(500).json({
      error: "Failed to record consent",
      requestId,
    });
  }
}
