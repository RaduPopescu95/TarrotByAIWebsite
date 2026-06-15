/**
 * Pure, server-side logic for recovering astrological analyses by contact.
 *
 * This is the authoritative version of the matching/dedup/entitlement logic that
 * used to live only in the mobile app (expo-mobile-app/src/utils/backupAnalysisUtils.js).
 * Keeping it here means we can change recovery behavior by deploying the website,
 * without shipping a new mobile build to the stores.
 *
 * Everything here is pure (no Firebase imports) so it is trivially unit-testable.
 */

export const ENTITLED_STATUSES = new Set([
  "succeeded",
  "captured",
  "paid",
  "verified",
  "legacy_imported",
]);

// Product codes per analysis family. Used by the legacy entitlement fallback.
export const PRODUCT_CODES = {
  astrogramaPersonal: "astrogama_natala",
  astrogramaOthers: "astrogama_natala_other_person",
  sinastrieOnePerson: "sinastrie_relatie",
  sinastrieOthers: "sinastrie_relatie_others",
};

export const asAnalysisArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object");
  }
  return typeof value === "object" ? [value] : [];
};

// Mirror of the Cloud Function normalizeContactPhone: digits only, no "00" prefix.
export const normalizeContactPhone = (phone) => {
  if (typeof phone !== "string") {
    return "";
  }
  const digitsOnly = phone.replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return "";
  }
  return digitsOnly.startsWith("00") ? digitsOnly.slice(2) : digitsOnly;
};

// Plausible formats a phone could have been stored under, for Firestore `in`
// queries (max 10 values). Mirrors the mobile buildPhoneQueryCandidates.
export const buildPhoneQueryCandidates = (phone) => {
  const candidates = new Set();
  const add = (value) => {
    const trimmed = String(value || "").trim();
    if (trimmed) {
      candidates.add(trimmed);
    }
  };

  const raw = String(phone || "").trim();
  add(raw);

  const digitsOnly = raw.replace(/[^\d]/g, "");
  add(digitsOnly);

  const normalized = normalizeContactPhone(raw);
  add(normalized);

  if (normalized) {
    add(`+${normalized}`);
    add(`00${normalized}`);

    if (normalized.startsWith("40")) {
      add(`0${normalized.slice(2)}`);
    }
    if (normalized.startsWith("0")) {
      add(`40${normalized.slice(1)}`);
      add(`+40${normalized.slice(1)}`);
      add(`0040${normalized.slice(1)}`);
    }
  }

  return Array.from(candidates).filter(Boolean).slice(0, 10);
};

export const normalizeContactEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export const buildEmailQueryCandidates = (email) => {
  const set = new Set();
  const raw = String(email || "").trim();
  if (raw) set.add(raw);
  const lower = normalizeContactEmail(raw);
  if (lower) set.add(lower);
  return Array.from(set).slice(0, 10);
};

// Completeness score: the more usable content an analysis has, the higher the
// score. Used so we never replace a rich analysis with a poorer one.
export const getAnalysisCompletenessScore = (analysis) => {
  if (!analysis || typeof analysis !== "object") {
    return 0;
  }

  let score = 0;

  if (analysis?.natalData?.data) score += 5;
  if (analysis?.aspectsData?.data) score += 2;
  if (analysis?.generalSignTextData) score += 2;
  if (analysis?.generalHouseTextData) score += 1;
  if (analysis?.ascendantData?.data) score += 1;
  if (analysis?.planetaryData?.data) score += 1;
  if (analysis?.cuspsData?.data) score += 1;

  if (analysis?.horoscopeResultsDaily?.data) score += 1;
  if (analysis?.horoscopeResultsWeekly?.data) score += 1;
  if (analysis?.horoscopeResultsMonthly?.data) score += 1;
  if (analysis?.horoscopeResultsYearly?.data) score += 1;

  if (analysis?.synastry?.natalWheelChart) score += 5;
  if (analysis?.synastry?.aspect) score += 2;

  return score;
};

const pickRicherAnalysis = (primary, secondary) => {
  if (!secondary) return primary;
  if (!primary) return secondary;
  return getAnalysisCompletenessScore(secondary) >
    getAnalysisCompletenessScore(primary)
    ? secondary
    : primary;
};

// Dedup key. Server-side we prefer `originalId` FIRST so the same logical
// analysis stored as TWO different Firestore documents (different doc ids, same
// originalId) collapses into one. Falls back to id, then to a content composite.
const resolveAnalysisKey = (item) =>
  String(
    item?.originalId ||
      item?.id ||
      `${item?.full_name || ""}|${item?.day || ""}|${item?.month || ""}|${
        item?.year || ""
      }`
  ).trim();

// Conservative merge across sources: keep the richer variant's content, do not
// lose fields from the other, OR isPaid. Stable ids are preserved.
export const mergeAnalysesByBestCompleteness = (...sources) => {
  const byKey = new Map();

  sources.forEach((source) => {
    asAnalysisArray(source).forEach((item) => {
      const key = resolveAnalysisKey(item);
      if (!key) {
        return;
      }

      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, item);
        return;
      }

      const richer = pickRicherAnalysis(existing, item);
      const poorer = richer === existing ? item : existing;
      byKey.set(key, {
        ...poorer,
        ...richer,
        id: existing?.id || item?.id || richer?.id,
        originalId:
          existing?.originalId ||
          item?.originalId ||
          existing?.id ||
          item?.id,
        isPaid: Boolean(existing?.isPaid || item?.isPaid),
        entitlementTransactionId:
          existing?.entitlementTransactionId ||
          item?.entitlementTransactionId ||
          "",
      });
    });
  });

  return Array.from(byKey.values());
};

// Collapse a list of raw Firestore docs so the same analysis appears once.
export const dedupAnalyses = (docs) =>
  mergeAnalysesByBestCompleteness(asAnalysisArray(docs));

// Index entitlements by analysisId and transactionId for robust matching.
const buildEntitlementMaps = (entitlements) => {
  const byAnalysisId = new Map();
  const byTransactionId = new Map();

  asAnalysisArray(entitlements).forEach((entitlement) => {
    const normalizedStatus = String(entitlement?.status || "").toLowerCase();
    if (!ENTITLED_STATUSES.has(normalizedStatus)) {
      return;
    }

    const analysisId =
      entitlement?.analysis?.analysisId ||
      entitlement?.analysisId ||
      entitlement?.metadata?.analysisId;
    if (analysisId) {
      byAnalysisId.set(String(analysisId), entitlement);
    }

    const transactionId =
      entitlement?.transactionId || entitlement?.metadata?.transactionId;
    if (transactionId) {
      byTransactionId.set(String(transactionId), entitlement);
    }
  });

  return { byAnalysisId, byTransactionId };
};

const applyEntitlementToAnalysisItem = (analysis, entitlementMaps) => {
  if (!analysis || typeof analysis !== "object") {
    return analysis;
  }

  const { byAnalysisId, byTransactionId } = entitlementMaps;
  const entitlement =
    byAnalysisId.get(String(analysis?.id || "")) ||
    byAnalysisId.get(String(analysis?.originalId || "")) ||
    byTransactionId.get(String(analysis?.entitlementTransactionId || "")) ||
    byTransactionId.get(String(analysis?.transactionId || ""));

  if (!entitlement) {
    return analysis;
  }

  return {
    ...analysis,
    isPaid: true,
    entitlementStatus: entitlement.status || "succeeded",
    entitlementTransactionId:
      entitlement.transactionId || analysis.entitlementTransactionId || "",
  };
};

export const applyEntitlementsToAnalyses = (analyses, entitlements) => {
  const entitlementMaps = buildEntitlementMaps(entitlements);
  return asAnalysisArray(analyses).map((analysis) =>
    applyEntitlementToAnalysisItem(analysis, entitlementMaps)
  );
};

// Legacy fallback for payments where the analysis id no longer matches (e.g.
// analysis regenerated after reinstall -> new id). Works at the analysis FAMILY
// level (same productCode) and is very conservative: it only marks unpaid
// analyses as paid if the number of "free" payments covers ALL unpaid analyses.
export const applyLegacyEntitlementFallback = (
  analyses,
  entitlements,
  { productCode } = {}
) => {
  const list = asAnalysisArray(analyses);
  if (!list.length || !productCode) {
    return list;
  }

  const targetProduct = String(productCode).toLowerCase();
  const validForProduct = asAnalysisArray(entitlements).filter((entitlement) => {
    const status = String(entitlement?.status || "").toLowerCase();
    return (
      ENTITLED_STATUSES.has(status) &&
      String(entitlement?.productCode || "").toLowerCase() === targetProduct
    );
  });

  if (!validForProduct.length) {
    return list;
  }

  const consumedTransactionIds = new Set(
    list
      .filter((analysis) => analysis?.isPaid)
      .map((analysis) => String(analysis?.entitlementTransactionId || ""))
      .filter(Boolean)
  );

  const freeEntitlements = validForProduct.filter(
    (entitlement) =>
      !consumedTransactionIds.has(String(entitlement?.transactionId || ""))
  );

  const unpaidIndexes = list
    .map((analysis, index) => (!analysis?.isPaid ? index : -1))
    .filter((index) => index !== -1);

  if (!unpaidIndexes.length || !freeEntitlements.length) {
    return list;
  }

  // Conservative: only apply if free payments cover ALL unpaid analyses.
  if (freeEntitlements.length < unpaidIndexes.length) {
    return list;
  }

  const result = list.slice();
  unpaidIndexes.forEach((index, position) => {
    const entitlement = freeEntitlements[position];
    if (!entitlement) {
      return;
    }
    result[index] = {
      ...result[index],
      isPaid: true,
      entitlementStatus: entitlement.status || "legacy_matched",
      entitlementTransactionId:
        entitlement.transactionId ||
        result[index].entitlementTransactionId ||
        "",
      entitlementMatchedBy: "legacy_contact_product",
    };
  });

  return result;
};

// Full pipeline for one analysis family: dedup raw docs, apply entitlements,
// then the conservative legacy fallback.
export const resolveAnalysisFamily = (docs, entitlements, { productCode } = {}) => {
  const deduped = dedupAnalyses(docs);
  const withEntitlements = applyEntitlementsToAnalyses(deduped, entitlements);
  return applyLegacyEntitlementFallback(withEntitlements, entitlements, {
    productCode,
  });
};
