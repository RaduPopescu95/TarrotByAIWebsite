function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function tsToIso(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    if (typeof value.toMillis === "function") return new Date(value.toMillis()).toISOString();
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
    if (typeof value._seconds === "number") return new Date(value._seconds * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
  } catch (_) {}
  return null;
}

function tokenPreview(token) {
  const t = safeStr(token);
  if (!t) return "";
  if (t.length <= 16) return t;
  return `${t.slice(0, 8)}…${t.slice(-6)}`;
}

export function hasDisplayName(row) {
  return Boolean(safeStr(row?.displayName));
}

export function hasCity(row) {
  return Boolean(safeStr(row?.city));
}

/**
 * @returns {"complete"|"missing_name"|"missing_city"|"legacy"}
 */
export function classifyUserTokenModel(row) {
  const nameOk = hasDisplayName(row);
  const cityOk = hasCity(row);
  if (nameOk && cityOk) return "complete";
  if (!nameOk && cityOk) return "missing_name";
  if (nameOk && !cityOk) return "missing_city";
  return "legacy";
}

export function modelFilterLabel(modelClass) {
  switch (modelClass) {
    case "complete":
      return "Complet";
    case "missing_name":
      return "Lipsește nume";
    case "missing_city":
      return "Lipsește oraș";
    case "legacy":
      return "Legacy";
    default:
      return "—";
  }
}

export function mapUserTokenDoc(docSnap) {
  const d = docSnap.data ? docSnap.data() || {} : docSnap.data || docSnap;
  const id = docSnap.id || d.id || "";
  const row = {
    id,
    displayName: safeStr(d.displayName),
    city: safeStr(d.city),
    region: safeStr(d.region),
    country: safeStr(d.country),
    email: safeStr(d.email),
    uid: safeStr(d.uid),
    language: safeStr(d.language),
    isIos: d.isIos === true,
    projectId: safeStr(d.projectId),
    disabled: d.disabled === true,
    lastSeenAt: tsToIso(d.lastSeenAt),
    locationUpdatedAt: tsToIso(d.locationUpdatedAt),
    disabledAt: tsToIso(d.disabledAt),
    tokenPreview: tokenPreview(d.token),
  };
  row.modelClass = classifyUserTokenModel(row);
  return row;
}

export function rowMatchesSearch(row, search) {
  const q = safeStr(search).toLowerCase();
  if (!q) return true;
  const haystack = [
    row.id,
    row.displayName,
    row.email,
    row.uid,
    row.city,
    row.region,
    row.country,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function rowMatchesCity(row, city) {
  const c = safeStr(city);
  if (!c) return true;
  const rowCity = safeStr(row.city).toLowerCase();
  return rowCity === c.toLowerCase() || rowCity.includes(c.toLowerCase());
}

export function rowMatchesModelFilter(row, modelFilter) {
  const f = safeStr(modelFilter).toLowerCase();
  if (!f || f === "all") return true;
  if (f === "legacy") {
    return row.modelClass === "legacy" || row.modelClass === "missing_name" || row.modelClass === "missing_city";
  }
  if (f === "missing_name") return !hasDisplayName(row);
  if (f === "missing_city") return !hasCity(row);
  if (f === "complete") return row.modelClass === "complete";
  return true;
}

export function applyUserTokenFilters(rows, filters = {}) {
  const { search, city, modelFilter, disabledOnly } = filters;
  return rows.filter((row) => {
    if (disabledOnly === true && !row.disabled) return false;
    if (!rowMatchesSearch(row, search)) return false;
    if (!rowMatchesCity(row, city)) return false;
    if (!rowMatchesModelFilter(row, modelFilter)) return false;
    return true;
  });
}

export function hasActiveUserTokenFilters(filters = {}) {
  return Boolean(
    safeStr(filters.search) ||
      safeStr(filters.city) ||
      (safeStr(filters.modelFilter) && safeStr(filters.modelFilter).toLowerCase() !== "all") ||
      filters.disabledOnly === true
  );
}

export function computeUserTokenStats(rows) {
  let complete = 0;
  let missingName = 0;
  let missingCity = 0;
  let legacy = 0;
  let disabled = 0;

  rows.forEach((row) => {
    if (row.disabled) disabled += 1;
    if (!hasDisplayName(row)) missingName += 1;
    if (!hasCity(row)) missingCity += 1;
    if (!hasDisplayName(row) || !hasCity(row)) legacy += 1;
    if (row.modelClass === "complete") complete += 1;
  });

  return {
    scanned: rows.length,
    complete,
    missingName,
    missingCity,
    legacy,
    disabled,
  };
}

export function collectDistinctCities(rows) {
  const set = new Set();
  rows.forEach((row) => {
    const c = safeStr(row.city);
    if (c) set.add(c);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "ro"));
}
