import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import { firestoreTsToMillis } from "./videoLibraryPublic";
import {
  dedupAnalyses,
  normalizeContactEmail,
  normalizeContactPhone,
} from "./recoverAnalyses";

export const ANALYSIS_FAMILIES = Object.freeze({
  personal: "analizeAstrogramaNatalaPersonala",
  astrogramaOthers: "analizeAstrogramaNatalaOthers",
  sinastrieOnePerson: "analizeSinastrieOnePerson",
  sinastrieOthers: "analizeSinastrieOthers",
});

const FAMILY_ALIASES = Object.freeze({
  personal: "personal",
  astrogramaPersonal: "personal",
  astrogramaOthers: "astrogramaOthers",
  sinastrieOnePerson: "sinastrieOnePerson",
  sinastrieOthers: "sinastrieOthers",
  personalSinastry: "sinastrieOnePerson",
  othersSinastry: "sinastrieOthers",
  othersAstrograma: "astrogramaOthers",
});

const INLINE_ANALYSIS_BYTES = 800 * 1024;
const MAX_ANALYSIS_BYTES = 7 * 1024 * 1024;
const PAYLOAD_CHUNK_CHARACTERS = 600 * 1024;
const PAYLOAD_CHUNKS_COLLECTION = "_analysisPayloadChunks";

export class AnalysisStoreError extends Error {
  constructor(message, statusCode = 400, code = "analysis_store_error") {
    super(message);
    this.name = "AnalysisStoreError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function resolveFamily(value, analysis) {
  const direct = FAMILY_ALIASES[String(value || "").trim()];
  if (direct) return direct;

  const type = String(analysis?.type || "").trim();
  if (FAMILY_ALIASES[type]) return FAMILY_ALIASES[type];
  if (analysis?.person1 && analysis?.person2) return "sinastrieOthers";
  if (analysis?.synastry) return "sinastrieOnePerson";
  if (type === "othersAstrograma") return "astrogramaOthers";
  if (analysis?.natalData) return "personal";

  throw new AnalysisStoreError("Invalid analysis family", 400, "invalid_family");
}

const uniqueTrimmed = (values) => {
  const result = [];
  const seen = new Set();
  (values || []).forEach((value) => {
    const normalized = String(value || "").trim();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  });
  return result;
};

export function resolveRequestIdentity(body = {}, decoded = null) {
  const contact = body?.contact && typeof body.contact === "object"
    ? body.contact
    : body;
  const phones = uniqueTrimmed([
    ...(Array.isArray(contact?.phones) ? contact.phones : []),
    contact?.phone,
    decoded?.phone_number,
  ]);
  const emails = uniqueTrimmed([
    ...(Array.isArray(contact?.emails) ? contact.emails : []),
    contact?.email,
    decoded?.email,
  ]);

  return {
    ownerUid: String(decoded?.uid || "").trim(),
    phones,
    emails,
    phone: phones[0] || "",
    email: emails[0] || "",
    phoneNormalized: normalizeContactPhone(phones[0] || ""),
    emailLower: normalizeContactEmail(emails[0] || ""),
    phoneNormalizedCandidates: uniqueTrimmed(phones.map(normalizeContactPhone)),
    emailLowerCandidates: uniqueTrimmed(emails.map(normalizeContactEmail)),
  };
}

export function assertUsableIdentity(identity) {
  if (
    !identity?.ownerUid &&
    !identity?.phoneNormalizedCandidates?.length &&
    !identity?.emailLowerCandidates?.length
  ) {
    throw new AnalysisStoreError(
      "Phone or email is required for guest analyses",
      400,
      "missing_contact"
    );
  }
}

const stripUndefined = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((item) => item !== undefined);
  }
  if (!value || typeof value !== "object") return value;

  const out = {};
  Object.entries(value).forEach(([key, child]) => {
    if (child === undefined) return;
    out[key] = stripUndefined(child);
  });
  return out;
};

const removeRedundantBase64 = (value) => {
  if (Array.isArray(value)) return value.map(removeRedundantBase64);
  if (!value || typeof value !== "object") return value;

  const hasSvg =
    typeof value.svg === "string" ||
    typeof value.natalWheelChart === "string" ||
    typeof value?.data?.svg === "string";
  const out = {};
  Object.entries(value).forEach(([key, child]) => {
    if (key === "base64_image" && hasSvg) return;
    out[key] = removeRedundantBase64(child);
  });
  return out;
};

export function prepareAnalysisForWrite(analysis, identity) {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) {
    throw new AnalysisStoreError("Invalid analysis payload", 400, "invalid_payload");
  }

  const analysisId = String(analysis.originalId || analysis.id || "").trim();
  if (!analysisId) {
    throw new AnalysisStoreError("Analysis id is required", 400, "missing_analysis_id");
  }

  const cleaned = stripUndefined(removeRedundantBase64(analysis));
  const payload = {
    ...cleaned,
    id: analysisId,
    originalId: analysisId,
    ownerUid: identity.ownerUid || "",
    owner_uid: identity.ownerUid || "",
    phone: identity.phone || String(cleaned.phone || ""),
    email: identity.email || String(cleaned.email || ""),
    phoneNormalized:
      identity.phoneNormalized || normalizeContactPhone(cleaned.phone || ""),
    emailLower: identity.emailLower || normalizeContactEmail(cleaned.email || ""),
    schemaVersion: 3,
    isActive: cleaned.isActive !== false,
  };

  const byteLength = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (byteLength > MAX_ANALYSIS_BYTES) {
    throw new AnalysisStoreError(
      `Analysis payload is too large (${byteLength} bytes)`,
      413,
      "analysis_too_large"
    );
  }

  return { analysisId, payload, byteLength };
}

const deterministicDocumentId = (family, analysisId) =>
  `v3_${family}_${crypto
    .createHash("sha256")
    .update(`${family}:${analysisId}`)
    .digest("hex")
    .slice(0, 40)}`;

export const encodeAnalysisPayloadChunks = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64"
  );
  const chunks = [];
  for (
    let index = 0;
    index < encoded.length;
    index += PAYLOAD_CHUNK_CHARACTERS
  ) {
    chunks.push(encoded.slice(index, index + PAYLOAD_CHUNK_CHARACTERS));
  }
  return chunks;
};

export const decodeAnalysisPayloadChunks = (chunks) =>
  JSON.parse(
    Buffer.from((chunks || []).join(""), "base64").toString("utf8")
  );

const documentMatchesIdentity = (data, identity) => {
  if (!data || data.isActive === false) return false;
  const ownerUid = String(data.ownerUid || data.owner_uid || "").trim();
  if (identity.ownerUid && ownerUid && ownerUid === identity.ownerUid) return true;

  const phoneNormalized = normalizeContactPhone(
    data.phoneNormalized || data.phone || ""
  );
  if (
    phoneNormalized &&
    identity.phoneNormalizedCandidates.includes(phoneNormalized)
  ) {
    return true;
  }

  const emailLower = normalizeContactEmail(data.emailLower || data.email || "");
  return Boolean(
    emailLower && identity.emailLowerCandidates.includes(emailLower)
  );
};

const snapshotToDocuments = (snapshot) =>
  snapshot.docs.map((docSnap) => ({
    documentId: docSnap.id,
    ...docSnap.data(),
  }));

async function findOwnedDocumentsByAnalysisId(db, family, analysisId, identity) {
  const collectionName = ANALYSIS_FAMILIES[family];
  const snapshot = await db
    .collection(collectionName)
    .where("originalId", "==", analysisId)
    .get();
  return snapshotToDocuments(snapshot).filter((item) =>
    documentMatchesIdentity(item, identity)
  );
}

export async function upsertAnalysis({ family, analysis, identity }) {
  assertUsableIdentity(identity);
  const resolvedFamily = resolveFamily(family, analysis);
  const { analysisId, payload, byteLength } = prepareAnalysisForWrite(
    analysis,
    identity
  );
  const db = getAdminDb();
  const collectionName = ANALYSIS_FAMILIES[resolvedFamily];
  const existing = await findOwnedDocumentsByAnalysisId(
    db,
    resolvedFamily,
    analysisId,
    identity
  );
  const documentId =
    existing[0]?.documentId ||
    deterministicDocumentId(resolvedFamily, analysisId);
  const ref = db.collection(collectionName).doc(documentId);
  const existingChunks = await ref.collection(PAYLOAD_CHUNKS_COLLECTION).get();
  const batch = db.batch();
  existingChunks.docs.forEach((chunkDoc) => batch.delete(chunkDoc.ref));

  if (byteLength <= INLINE_ANALYSIS_BYTES) {
    batch.set(ref, {
      ...payload,
      documentId,
      payloadStorage: "inline",
      payloadByteLength: byteLength,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.length
        ? {}
        : { createdAtServer: FieldValue.serverTimestamp() }),
    });
  } else {
    const chunks = encodeAnalysisPayloadChunks(payload);
    if (chunks.length + existingChunks.size + 1 > 490) {
      throw new AnalysisStoreError(
        "Analysis requires too many Firestore chunks",
        413,
        "analysis_too_large"
      );
    }

    const summary = toSummary(payload, resolvedFamily);
    batch.set(ref, {
      ...summary,
      id: analysisId,
      originalId: analysisId,
      documentId,
      ownerUid: payload.ownerUid,
      owner_uid: payload.owner_uid,
      phone: payload.phone,
      email: payload.email,
      phoneNormalized: payload.phoneNormalized,
      emailLower: payload.emailLower,
      schemaVersion: payload.schemaVersion,
      isActive: payload.isActive,
      payloadStorage: "chunks-v1",
      payloadEncoding: "base64-json",
      payloadChunkCount: chunks.length,
      payloadByteLength: byteLength,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.length
        ? {}
        : { createdAtServer: FieldValue.serverTimestamp() }),
    });
    chunks.forEach((chunk, index) => {
      const chunkId = String(index).padStart(4, "0");
      batch.set(ref.collection(PAYLOAD_CHUNKS_COLLECTION).doc(chunkId), {
        index,
        chunk,
      });
    });
  }
  await batch.commit();

  return {
    family: resolvedFamily,
    analysisId,
    documentId,
    byteLength,
    persisted: true,
  };
}

async function queryFamilyByIdentity(db, family, identity) {
  const collectionRef = db.collection(ANALYSIS_FAMILIES[family]);
  const tasks = [];

  if (identity.ownerUid) {
    tasks.push(collectionRef.where("ownerUid", "==", identity.ownerUid).get());
    tasks.push(collectionRef.where("owner_uid", "==", identity.ownerUid).get());
  }
  identity.phoneNormalizedCandidates.forEach((phone) => {
    tasks.push(collectionRef.where("phoneNormalized", "==", phone).get());
  });
  identity.emailLowerCandidates.forEach((email) => {
    tasks.push(collectionRef.where("emailLower", "==", email).get());
  });
  identity.phones.forEach((phone) => {
    tasks.push(collectionRef.where("phone", "==", phone).get());
  });
  identity.emails.forEach((email) => {
    tasks.push(collectionRef.where("email", "==", email).get());
  });

  const snapshots = await Promise.all(tasks);
  const byDocumentId = new Map();
  snapshots.flatMap(snapshotToDocuments).forEach((item) => {
    if (documentMatchesIdentity(item, identity)) {
      byDocumentId.set(item.documentId, item);
    }
  });
  return dedupAnalyses(Array.from(byDocumentId.values()));
}

const normalizeSummaryTimestamp = (value) => {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  const ms = firestoreTsToMillis(value);
  return ms == null ? null : new Date(ms).toISOString();
};

const toSummary = (analysis, family) => ({
  id: analysis.originalId || analysis.id,
  originalId: analysis.originalId || analysis.id,
  documentId: analysis.documentId || "",
  family,
  type: analysis.type || "",
  full_name: analysis.full_name || "",
  person1: analysis.person1 || null,
  person2: analysis.person2 || null,
  day: analysis.day || "",
  month: analysis.month || "",
  year: analysis.year || "",
  actualLanguage: analysis.actualLanguage || "",
  actualLanguageAstrograma: analysis.actualLanguageAstrograma || "",
  actualLanguageSinastrie: analysis.actualLanguageSinastrie || "",
  isPaid: Boolean(analysis.isPaid),
  isActive: analysis.isActive !== false,
  hasNatalData: Boolean(analysis?.natalData?.data),
  hasSynastry: Boolean(analysis?.synastry?.natalWheelChart),
  createdAt: normalizeSummaryTimestamp(
    analysis.createdAt || analysis.createdAtServer || null
  ),
  updatedAt: normalizeSummaryTimestamp(analysis.updatedAt || null),
});

export async function searchAnalyses({ identity, families }) {
  assertUsableIdentity(identity);
  const requestedFamilies = Array.isArray(families) && families.length
    ? families.map((family) => resolveFamily(family))
    : Object.keys(ANALYSIS_FAMILIES);
  const db = getAdminDb();
  const entries = await Promise.all(
    requestedFamilies.map(async (family) => [
      family,
      await queryFamilyByIdentity(db, family, identity),
    ])
  );

  return Object.fromEntries(
    entries.map(([family, analyses]) => [
      family,
      analyses.filter((item) => item.isActive !== false).map((item) =>
        toSummary(item, family)
      ),
    ])
  );
}

export async function getAnalysisDetail({ family, analysisId, identity }) {
  assertUsableIdentity(identity);
  const resolvedFamily = resolveFamily(family);
  const db = getAdminDb();
  const matches = await findOwnedDocumentsByAnalysisId(
    db,
    resolvedFamily,
    String(analysisId || "").trim(),
    identity
  );
  if (!matches.length) {
    throw new AnalysisStoreError("Analysis not found", 404, "not_found");
  }
  const selected = dedupAnalyses(matches)[0];
  if (selected.payloadStorage !== "chunks-v1") return selected;

  const chunksSnapshot = await db
    .collection(ANALYSIS_FAMILIES[resolvedFamily])
    .doc(selected.documentId)
    .collection(PAYLOAD_CHUNKS_COLLECTION)
    .orderBy("index", "asc")
    .get();
  if (chunksSnapshot.size !== Number(selected.payloadChunkCount || 0)) {
    throw new AnalysisStoreError(
      "Analysis payload is incomplete",
      500,
      "incomplete_payload"
    );
  }
  try {
    const payload = decodeAnalysisPayloadChunks(
      chunksSnapshot.docs.map((docSnap) =>
        String(docSnap.data()?.chunk || "")
      )
    );
    return {
      ...payload,
      documentId: selected.documentId,
      isPaid: Boolean(selected.isPaid || payload.isPaid),
      isActive: selected.isActive !== false,
      updatedAt: selected.updatedAt || payload.updatedAt || null,
    };
  } catch {
    throw new AnalysisStoreError(
      "Analysis payload could not be decoded",
      500,
      "invalid_payload_chunks"
    );
  }
}

export async function updateAnalysis({ family, analysisId, patch, identity }) {
  const existing = await getAnalysisDetail({
    family,
    analysisId,
    identity,
  });
  const forbiddenKeys = new Set([
    "id",
    "originalId",
    "documentId",
    "ownerUid",
    "owner_uid",
    "phone",
    "phoneNormalized",
    "email",
    "emailLower",
  ]);
  const safePatch = {};
  Object.entries(patch && typeof patch === "object" ? patch : {}).forEach(
    ([key, value]) => {
      if (!forbiddenKeys.has(key) && value !== undefined) safePatch[key] = value;
    }
  );
  return upsertAnalysis({
    family,
    identity,
    analysis: { ...existing, ...safePatch, id: analysisId, originalId: analysisId },
  });
}

export async function deleteAnalysis({ family, analysisId, identity }) {
  const resolvedFamily = resolveFamily(family);
  const db = getAdminDb();
  const matches = await findOwnedDocumentsByAnalysisId(
    db,
    resolvedFamily,
    String(analysisId || "").trim(),
    identity
  );
  if (!matches.length) {
    throw new AnalysisStoreError("Analysis not found", 404, "not_found");
  }

  const batch = db.batch();
  matches.forEach((item) => {
    batch.set(
      db.collection(ANALYSIS_FAMILIES[resolvedFamily]).doc(item.documentId),
      {
        isActive: false,
        deletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
  await batch.commit();
  return { family: resolvedFamily, analysisId, deleted: true };
}
