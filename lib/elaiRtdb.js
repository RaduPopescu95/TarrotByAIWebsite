import { getAdminRtdb } from "./firebaseAdmin";
import {
  ELAI_LANGUAGES,
  ensureElaiMeta,
  normalizeVarianteRecord,
  computeRecordIsRendering,
} from "../utils/elaiStatusUtils";

const VARIANTE_PATH = "Citire-Personalizata/VarianteCarti";

export function getVarianteCartiPath(recordId) {
  if (recordId === undefined || recordId === null || recordId === "") return VARIANTE_PATH;
  return `${VARIANTE_PATH}/${recordId}`;
}

export async function loadVarianteCartiRecords() {
  const rtdb = getAdminRtdb();
  const snapshot = await rtdb.ref(VARIANTE_PATH).once("value");
  const value = snapshot.val();
  if (!value || typeof value !== "object") return [];

  return Object.values(value)
    .filter((item) => item && typeof item === "object")
    .map((item) => normalizeVarianteRecord(item));
}

export async function loadVarianteCartiRecord(recordId) {
  const rtdb = getAdminRtdb();
  const snapshot = await rtdb.ref(getVarianteCartiPath(recordId)).once("value");
  if (!snapshot.exists()) return null;
  return normalizeVarianteRecord(snapshot.val());
}

export async function saveVarianteCartiRecord(record) {
  if (!record || !record.id) {
    throw new Error("Missing record id when saving VarianteCarti record.");
  }
  const normalized = normalizeVarianteRecord(record);
  const rtdb = getAdminRtdb();
  await rtdb.ref(getVarianteCartiPath(normalized.id)).set(normalized);
  return normalized;
}

export function findLanguagesForVideoId(record, videoId) {
  const normalized = normalizeVarianteRecord(record);
  const matches = [];

  for (const lang of Object.keys(normalized.info || {})) {
    const langInfo = ensureElaiMeta(normalized.info[lang]);
    if (langInfo._id && langInfo._id === videoId) {
      matches.push({ lang, info: langInfo });
    }
  }

  return matches;
}

export function applyLanguageUpdate(record, lang, nextInfo) {
  const normalized = normalizeVarianteRecord(record);
  const safeNext = ensureElaiMeta(nextInfo);
  const info = {
    ...normalized.info,
    [lang]: safeNext,
  };

  return {
    ...normalized,
    info,
    isRendering: computeRecordIsRendering(info),
  };
}

export function buildAllLanguageTargets(record) {
  const normalized = normalizeVarianteRecord(record);
  const targets = [];

  for (const lang of ELAI_LANGUAGES) {
    const info = ensureElaiMeta(normalized.info[lang]);
    if (!info._id) continue;
    targets.push({
      recordId: normalized.id,
      lang,
      videoId: info._id,
      info,
    });
  }

  return targets;
}
