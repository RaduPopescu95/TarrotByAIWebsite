import { getAdminAuth, getAdminDb } from "./firebaseAdmin";

function sanitizeIdToken(value) {
  if (typeof value !== "string") return "";
  const t = value.trim();
  return t || "";
}

/**
 * Firebase ID token from mobile/web. Checks (in order):
 * - Authorization: Bearer
 * - x-firebase-id-token (some proxies strip Authorization)
 * - req.body.firebaseIdToken / req.body.idToken (Expo fallback; strip before persisting req.body)
 */
export function extractIdToken(req) {
  const authHeader = req.headers?.authorization || "";
  if (typeof authHeader === "string" && /^Bearer\s+/i.test(authHeader)) {
    const t = sanitizeIdToken(authHeader.replace(/^Bearer\s+/i, ""));
    if (t) return t;
  }
  const headerToken = req.headers?.["x-firebase-id-token"];
  if (typeof headerToken === "string") {
    const t = sanitizeIdToken(headerToken);
    if (t) return t;
  }
  const body = req.body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const bt = body.firebaseIdToken || body.idToken;
    if (typeof bt === "string") {
      const t = sanitizeIdToken(bt);
      if (t) return t;
    }
  }
  return null;
}

export function omitFirebaseIdTokenFromPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  const { firebaseIdToken: _a, idToken: _b, ...rest } = body;
  return rest;
}

export async function requireAuth(req) {
  const token = extractIdToken(req);
  if (!token) {
    const err = new Error("Missing auth token");
    err.statusCode = 401;
    throw err;
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    const err = new Error("Invalid auth token");
    err.statusCode = 401;
    throw err;
  }
}

export async function getOptionalAuth(req) {
  const token = extractIdToken(req);
  if (!token) return null;
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (_) {
    return null;
  }
}

export async function requireAdmin(req) {
  const decoded = await requireAuth(req);
  const uid = decoded.uid;
  const db = getAdminDb();
  let userData = null;
  const directSnap = await db.collection("Users").doc(uid).get();
  if (directSnap.exists) {
    userData = directSnap.data() || null;
  } else {
    const snapshot = await db
      .collection("Users")
      .where("owner_uid", "==", uid)
      .limit(1)
      .get();
    userData = snapshot.docs[0]?.data() || null;
  }
  const role = userData?.role;
  if (role !== "admin") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  return { uid, role };
}

export function requireDashboardAccess(req) {
  const raw =
    req.headers?.["x-dashboard-access"] ||
    req.headers?.["x-dashboard-token"] ||
    req.headers?.["x-dashboard-guard"];
  if (!raw || typeof raw !== "string") {
    const err = new Error("Acces dashboard necesar");
    err.statusCode = 401;
    throw err;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.granted || typeof parsed.expiresAt !== "number") {
      const err = new Error("Acces dashboard necesar");
      err.statusCode = 401;
      throw err;
    }
    if (parsed.expiresAt <= Date.now()) {
      const err = new Error("Acces dashboard expirat");
      err.statusCode = 401;
      throw err;
    }
    return parsed;
  } catch (_) {
    const err = new Error("Acces dashboard necesar");
    err.statusCode = 401;
    throw err;
  }
}
