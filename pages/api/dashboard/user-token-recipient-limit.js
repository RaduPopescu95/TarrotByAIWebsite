import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  DEFAULT_RECIPIENT_LIMIT_CITIES,
  DEFAULT_RECIPIENT_LIMIT_NAMES,
  normalizeRecipientLimitCriteria,
} from "../../../lib/userTokenRecipientLimit";

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";
const CONFIG_COLLECTION = "notificationSettings";
const CONFIG_DOC_ID = "userTokenRecipientLimit";
const TARGET_COLLECTION = "notificationRecipientTargets";

function requestId() {
  return `utrl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return typeof req.body === "object" ? req.body : {};
}

function timestampToIso(value) {
  try {
    if (value && typeof value.toDate === "function") return value.toDate().toISOString();
    if (value && typeof value.toMillis === "function") {
      return new Date(value.toMillis()).toISOString();
    }
  } catch (_) {}
  return null;
}

function tokenPreview(token) {
  const value = typeof token === "string" ? token.trim() : "";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-7)}`;
}

function serializeConfig(data = {}) {
  const criteria = normalizeRecipientLimitCriteria(data.criteria || {});
  const activeCriteria = data.activeCriteria
    ? normalizeRecipientLimitCriteria(data.activeCriteria)
    : criteria;
  return {
    desiredEnabled: data.desiredEnabled === true,
    enabled: data.enabled === true,
    status: typeof data.status === "string" ? data.status : "ready",
    criteria,
    activeCriteria,
    requestVersion: data.requestVersion || null,
    activeVersion: data.activeVersion || null,
    buildingVersion: data.buildingVersion || null,
    recipientCount: Number(data.recipientCount) || 0,
    matchedDocumentCount: Number(data.matchedDocumentCount) || 0,
    scannedCount: Number(data.scannedCount) || 0,
    lastError: typeof data.lastError === "string" ? data.lastError : "",
    activatedAt: timestampToIso(data.activatedAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

async function loadRecipients(db, activeVersion) {
  if (!activeVersion) return [];
  const snapshot = await db
    .collection(TARGET_COLLECTION)
    .where("version", "==", activeVersion)
    .get();
  const byToken = new Map();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const token = typeof data.token === "string" ? data.token.trim() : "";
    if (!token) return;
    const row = {
      id: data.userTokenDocId || docSnap.id,
      displayName: data.displayName || "",
      city: data.city || "",
      email: data.email || "",
      uid: data.uid || "",
      isIos: data.isIos === true,
      language: data.language || "",
      tokenPreview: tokenPreview(token),
      matchReasons: Array.isArray(data.matchReasons) ? data.matchReasons : [],
    };
    if (!byToken.has(token)) {
      byToken.set(token, row);
      return;
    }
    const existing = byToken.get(token);
    existing.matchReasons = [...new Set([...existing.matchReasons, ...row.matchReasons])];
  });

  return [...byToken.values()].sort((left, right) => {
    const cityCompare = left.city.localeCompare(right.city, "ro");
    if (cityCompare !== 0) return cityCompare;
    return left.displayName.localeCompare(right.displayName, "ro");
  });
}

async function handleGet(req, res, id) {
  const db = getAdminDb();
  const snapshot = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get();
  const config = snapshot.exists
    ? serializeConfig(snapshot.data() || {})
    : serializeConfig({
        desiredEnabled: false,
        enabled: false,
        status: "ready",
        criteria: {
          cities: DEFAULT_RECIPIENT_LIMIT_CITIES,
          names: DEFAULT_RECIPIENT_LIMIT_NAMES,
        },
      });
  const includeRecipients =
    req.query?.includeRecipients === "1" || req.query?.includeRecipients === "true";
  const recipients = includeRecipients
    ? await loadRecipients(db, config.activeVersion)
    : undefined;

  return res.status(200).json({
    config: {
      ...config,
      ...(recipients ? { recipientCount: recipients.length } : {}),
    },
    ...(recipients ? { recipients } : {}),
    requestId: id,
  });
}

async function handlePut(req, res, id) {
  const body = readBody(req);
  if (typeof body.enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be boolean", requestId: id });
  }
  const criteria = normalizeRecipientLimitCriteria(body.criteria || {}, {
    useDefaults: true,
  });
  if (body.enabled && criteria.cities.length === 0 && criteria.names.length === 0) {
    return res.status(400).json({
      error: "At least one city or name is required",
      requestId: id,
    });
  }

  const db = getAdminDb();
  const ref = db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID);
  const version = `rl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await ref.set(
    {
      desiredEnabled: body.enabled,
      criteria,
      requestVersion: version,
      status: "requested",
      lastError: FieldValue.delete(),
      requestedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return res.status(202).json({
    ok: true,
    requestVersion: version,
    desiredEnabled: body.enabled,
    criteria,
    status: "requested",
    requestId: id,
  });
}

export default async function handler(req, res) {
  const id = requestId();
  res.setHeader("X-Request-Id", id);
  if ((req.headers["x-dashboard-token"] || "") !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized", requestId: id });
  }

  try {
    if (req.method === "GET") return await handleGet(req, res, id);
    if (req.method === "PUT") return await handlePut(req, res, id);
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed", requestId: id });
  } catch (error) {
    console.error("[dashboard/user-token-recipient-limit]", {
      requestId: id,
      method: req.method,
      message: error?.message || String(error),
    });
    return res.status(500).json({
      error: "Failed to process recipient limit request",
      requestId: id,
      detail: process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
}
