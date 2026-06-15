import { Timestamp } from "firebase-admin/firestore";
import { firestoreTsToMillis } from "../videoLibraryPublic";
import {
  ALLOWED_LINK_TYPES,
  ALLOWED_LOCALES,
  isValidPartnerPromotionZone,
  PARTNER_PROMOTION_ZONE_IDS,
} from "./zones";

export const COLLECTION = "partnerPromotions";
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_NAME_LENGTH = 120;

export function parsePartnerPromotionDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function serializePartnerPromotionRow(docSnap) {
  if (!docSnap?.exists) return null;
  const data = docSnap.data() || {};
  const displayStartAt = parsePartnerPromotionDate(data.displayStartAt);
  const displayEndAt = parsePartnerPromotionDate(data.displayEndAt);
  return {
    id: docSnap.id,
    name: typeof data.name === "string" ? data.name.trim() : "",
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl.trim() : "",
    description: typeof data.description === "string" ? data.description.trim() : "",
    linkUrl: typeof data.linkUrl === "string" ? data.linkUrl.trim() : "",
    linkType: ALLOWED_LINK_TYPES.includes(data.linkType) ? data.linkType : "website",
    displayStartAt: displayStartAt ? displayStartAt.toISOString() : null,
    displayEndAt: displayEndAt ? displayEndAt.toISOString() : null,
    isActive: data.isActive === true,
    placements: Array.isArray(data.placements)
      ? data.placements.filter((p) => isValidPartnerPromotionZone(p))
      : [],
    sortOrder: typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 0,
    locale: ALLOWED_LOCALES.includes(data.locale) ? data.locale : "all",
    createdAt: parsePartnerPromotionDate(data.createdAt)?.toISOString() || null,
    updatedAt: parsePartnerPromotionDate(data.updatedAt)?.toISOString() || null,
  };
}

function normalizePlacements(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const id = typeof item === "string" ? item.trim() : "";
    if (!isValidPartnerPromotionZone(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function validatePartnerPromotionInput(input, { partial = false } = {}) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["body"] };
  }

  const requireField = (key, valid) => {
    if (partial && input[key] === undefined) return;
    if (!valid) errors.push(key);
  };

  requireField(
    "name",
    typeof input.name === "string" &&
      input.name.trim().length > 0 &&
      input.name.trim().length <= MAX_NAME_LENGTH
  );
  requireField("logoUrl", typeof input.logoUrl === "string" && input.logoUrl.trim().length > 0);
  requireField(
    "description",
    typeof input.description === "string" &&
      input.description.trim().length > 0 &&
      input.description.trim().length <= MAX_DESCRIPTION_LENGTH
  );
  requireField("linkUrl", typeof input.linkUrl === "string" && input.linkUrl.trim().length > 0);
  requireField(
    "linkType",
    input.linkType === undefined ||
      (typeof input.linkType === "string" && ALLOWED_LINK_TYPES.includes(input.linkType))
  );

  if (input.displayStartAt !== undefined) {
    requireField("displayStartAt", parsePartnerPromotionDate(input.displayStartAt) !== null);
  } else if (!partial) {
    errors.push("displayStartAt");
  }

  if (input.displayEndAt !== undefined) {
    requireField("displayEndAt", parsePartnerPromotionDate(input.displayEndAt) !== null);
  } else if (!partial) {
    errors.push("displayEndAt");
  }

  if (input.displayStartAt !== undefined && input.displayEndAt !== undefined) {
    const start = parsePartnerPromotionDate(input.displayStartAt);
    const end = parsePartnerPromotionDate(input.displayEndAt);
    if (start && end && end.getTime() < start.getTime()) {
      errors.push("displayEndAt");
    }
  }

  if (input.isActive !== undefined && typeof input.isActive !== "boolean") {
    errors.push("isActive");
  }

  if (input.placements !== undefined) {
    const placements = normalizePlacements(input.placements);
    if (placements.length === 0) errors.push("placements");
  } else if (!partial) {
    errors.push("placements");
  }

  if (
    input.sortOrder !== undefined &&
    (typeof input.sortOrder !== "number" || !Number.isFinite(input.sortOrder))
  ) {
    errors.push("sortOrder");
  }

  if (
    input.locale !== undefined &&
    (typeof input.locale !== "string" || !ALLOWED_LOCALES.includes(input.locale))
  ) {
    errors.push("locale");
  }

  return { ok: errors.length === 0, errors };
}

export function buildPartnerPromotionWritePayload(input, { partial = false } = {}) {
  const payload = {};
  if (!partial || input.name !== undefined) payload.name = String(input.name).trim();
  if (!partial || input.logoUrl !== undefined) payload.logoUrl = String(input.logoUrl).trim();
  if (!partial || input.description !== undefined) payload.description = String(input.description).trim();
  if (!partial || input.linkUrl !== undefined) payload.linkUrl = String(input.linkUrl).trim();
  if (!partial || input.linkType !== undefined) {
    payload.linkType = ALLOWED_LINK_TYPES.includes(input.linkType) ? input.linkType : "website";
  }
  if (!partial || input.displayStartAt !== undefined) {
    const d = parsePartnerPromotionDate(input.displayStartAt);
    if (d) payload.displayStartAt = Timestamp.fromDate(d);
  }
  if (!partial || input.displayEndAt !== undefined) {
    const d = parsePartnerPromotionDate(input.displayEndAt);
    if (d) payload.displayEndAt = Timestamp.fromDate(d);
  }
  if (!partial || input.isActive !== undefined) payload.isActive = input.isActive === true;
  if (!partial || input.placements !== undefined) payload.placements = normalizePlacements(input.placements);
  if (!partial || input.sortOrder !== undefined) {
    payload.sortOrder =
      typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder) ? input.sortOrder : 0;
  }
  if (!partial || input.locale !== undefined) {
    payload.locale = ALLOWED_LOCALES.includes(input.locale) ? input.locale : "all";
  }
  payload.updatedAt = Timestamp.now();
  return payload;
}

export function normalizePartnerPromotionLocale(value, fallback = "ro") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const base = value.trim().toLowerCase().split("-")[0];
  return base || fallback;
}

export function isPartnerPromotionLive(row, nowMs = Date.now()) {
  if (!row || row.isActive !== true) return false;
  const startMs = row.displayStartAt ? Date.parse(row.displayStartAt) : null;
  const endMs = row.displayEndAt ? Date.parse(row.displayEndAt) : null;
  if (startMs !== null && Number.isFinite(startMs) && startMs > nowMs) return false;
  if (endMs !== null && Number.isFinite(endMs) && endMs < nowMs) return false;
  return true;
}

export function matchesPartnerPromotionLocale(row, locale) {
  const loc = normalizePartnerPromotionLocale(locale, "ro");
  const rowLocale = typeof row?.locale === "string" ? row.locale : "all";
  return rowLocale === "all" || rowLocale === loc;
}

export function mapRowToPublicPromotionDto(row) {
  if (!row?.id) return null;
  return {
    id: row.id,
    name: row.name || "",
    logoUrl: row.logoUrl || "",
    description: row.description || "",
    linkUrl: row.linkUrl || "",
    linkType: row.linkType || "website",
  };
}

export function filterPublicPartnerPromotions(rows, { placement, locale, nowMs = Date.now() }) {
  const placementNorm = typeof placement === "string" ? placement.trim() : "";
  if (!isValidPartnerPromotionZone(placementNorm)) return [];

  return (Array.isArray(rows) ? rows : [])
    .filter((row) => {
      if (!isPartnerPromotionLive(row, nowMs)) return false;
      if (!matchesPartnerPromotionLocale(row, locale)) return false;
      const placements = Array.isArray(row.placements) ? row.placements : [];
      return placements.includes(placementNorm);
    })
    .sort((a, b) => {
      const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
      const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.name || "").localeCompare(String(b.name || ""));
    })
    .map(mapRowToPublicPromotionDto)
    .filter(Boolean);
}

export function computeNextPartnerPromotionChangeAtMs(rows, nowMs = Date.now()) {
  let next = null;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.isActive !== true) continue;
    const startMs = row.displayStartAt ? Date.parse(row.displayStartAt) : null;
    const endMs = row.displayEndAt ? Date.parse(row.displayEndAt) : null;
    for (const candidate of [startMs, endMs]) {
      if (!Number.isFinite(candidate) || candidate <= nowMs) continue;
      if (next == null || candidate < next) next = candidate;
    }
  }
  return next;
}

export function resolvePartnerPromotionLinkUrl(linkUrl, linkType) {
  const raw = typeof linkUrl === "string" ? linkUrl.trim() : "";
  if (!raw) return "";
  if (linkType !== "whatsapp") return raw;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("whatsapp:")) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : raw;
}

export { PARTNER_PROMOTION_ZONE_IDS };
