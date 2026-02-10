import { getAdminAuth, getAdminDb } from "./firebaseAdmin";

function extractBearerToken(req) {
  const header = req.headers?.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

export async function requireAuth(req) {
  const token = extractBearerToken(req);
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
  const token = extractBearerToken(req);
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
  const snapshot = await db
    .collection("Users")
    .where("owner_uid", "==", uid)
    .limit(1)
    .get();
  const userDoc = snapshot.docs[0];
  const role = userDoc?.data()?.role;
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
