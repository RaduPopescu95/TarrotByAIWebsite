import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import {
  CONSENT_RATE_LIMIT_PER_SESSION_PER_MIN,
  VALID_CONSENT_ACTIONS,
  VALID_CONTENT_TYPES,
  VALID_PLATFORMS,
  VALID_SOURCES,
  VIDEO_PLAYBACK_CONSENT_COLLECTION,
  VIDEO_PLAYBACK_TERMS_VERSION,
} from "./videoPlaybackConsentConstants";

const sessionRateBuckets = new Map();

function pruneRateBucket(bucket, nowMs) {
  const windowStart = nowMs - 60_000;
  while (bucket.length > 0 && bucket[0] < windowStart) {
    bucket.shift();
  }
}

function checkSessionRateLimit(sessionId, nowMs = Date.now()) {
  const key = String(sessionId || "").trim();
  if (!key) return { ok: false, reason: "missing_session_id" };
  let bucket = sessionRateBuckets.get(key);
  if (!bucket) {
    bucket = [];
    sessionRateBuckets.set(key, bucket);
  }
  pruneRateBucket(bucket, nowMs);
  if (bucket.length >= CONSENT_RATE_LIMIT_PER_SESSION_PER_MIN) {
    return { ok: false, reason: "rate_limited" };
  }
  bucket.push(nowMs);
  return { ok: true };
}

function trimString(value, maxLen) {
  if (typeof value !== "string") return "";
  const t = value.trim();
  if (!t) return "";
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function hashTokenFingerprint(token) {
  const normalized = typeof token === "string" ? token.trim() : "";
  if (!normalized) return "";
  let hash = 5381;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return `tok_${(hash >>> 0).toString(16)}`;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, data: object } | { ok: false, error: string, status: number }}
 */
export function validateVideoPlaybackConsentBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid body", status: 400 };
  }

  const action = trimString(body.action, 16);
  const sessionId = trimString(body.sessionId, 128);
  const termsVersion = trimString(body.termsVersion, 64);
  const contentType = trimString(body.contentType, 32);
  const contentId = trimString(body.contentId, 128);
  const platform = trimString(body.platform, 16);
  const title = trimString(body.title, 500);
  const source = trimString(body.source, 16);
  const locale = trimString(body.locale, 16) || "ro";

  if (!VALID_CONSENT_ACTIONS.has(action)) {
    return { ok: false, error: "Invalid action", status: 400 };
  }
  if (!sessionId) {
    return { ok: false, error: "Missing sessionId", status: 400 };
  }
  if (!termsVersion || termsVersion !== VIDEO_PLAYBACK_TERMS_VERSION) {
    return { ok: false, error: "Invalid or outdated termsVersion", status: 400 };
  }
  if (!VALID_CONTENT_TYPES.has(contentType)) {
    return { ok: false, error: "Invalid contentType", status: 400 };
  }
  if (!contentId) {
    return { ok: false, error: "Missing contentId", status: 400 };
  }
  if (!VALID_PLATFORMS.has(platform)) {
    return { ok: false, error: "Invalid platform", status: 400 };
  }
  if (!VALID_SOURCES.has(source)) {
    return { ok: false, error: "Invalid source", status: 400 };
  }

  return {
    ok: true,
    data: {
      action,
      sessionId,
      termsVersion,
      contentType,
      contentId,
      platform,
      title,
      source,
      locale,
      displayName: trimString(body.displayName, 120),
      guestEmail: trimString(body.guestEmail, 254),
      deviceToken: trimString(body.deviceToken, 512),
    },
  };
}

function resolveClientIp(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  return trimString(req?.socket?.remoteAddress, 64) || null;
}

async function enrichIdentity(uid, payload) {
  if (!uid) return payload;
  try {
    const snap = await getAdminDb().collection("Users").doc(uid).get();
    if (!snap.exists) return payload;
    const data = snap.data() || {};
    const first = trimString(data.first_name, 80);
    const last = trimString(data.last_name, 80);
    const email = trimString(data.email, 254);
    const fullName = [first, last].filter(Boolean).join(" ").trim();
    return {
      ...payload,
      uid,
      email: payload.email || email || null,
      displayName: payload.displayName || fullName || first || null,
      firstName: first || null,
      lastName: last || null,
    };
  } catch {
    return { ...payload, uid };
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {object} validated from validateVideoPlaybackConsentBody
 * @param {{ uid?: string | null, email?: string | null }} authIdentity
 */
export async function recordVideoPlaybackConsent(req, validated, authIdentity = {}) {
  const rate = checkSessionRateLimit(validated.sessionId);
  if (!rate.ok) {
    const err = new Error("Too many requests");
    err.statusCode = 429;
    throw err;
  }

  const tokenFingerprint = hashTokenFingerprint(validated.deviceToken);
  const nowField =
    validated.action === "accept" ? { acceptedAt: FieldValue.serverTimestamp() } : {};

  let doc = {
    action: validated.action,
    sessionId: validated.sessionId,
    termsVersion: validated.termsVersion,
    contentType: validated.contentType,
    contentId: validated.contentId,
    platform: validated.platform,
    title: validated.title || "",
    source: validated.source,
    locale: validated.locale,
    uid: authIdentity.uid || null,
    email: authIdentity.email || validated.guestEmail || null,
    displayName: validated.displayName || null,
    deviceTokenFingerprint: tokenFingerprint || null,
    userAgent: trimString(req?.headers?.["user-agent"], 512) || null,
    ip: resolveClientIp(req),
    recordedAt: FieldValue.serverTimestamp(),
    viewedAt: FieldValue.serverTimestamp(),
    ...nowField,
  };

  doc = await enrichIdentity(authIdentity.uid || null, doc);

  const ref = await getAdminDb()
    .collection(VIDEO_PLAYBACK_CONSENT_COLLECTION)
    .add(doc);

  return { id: ref.id, action: validated.action };
}

export function __resetConsentRateLimitsForTests() {
  sessionRateBuckets.clear();
}
