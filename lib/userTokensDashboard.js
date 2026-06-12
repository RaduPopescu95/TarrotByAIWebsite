function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toLower(value) {
  return safeStr(value).toLowerCase();
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => safeStr(item)).filter(Boolean));
  }

  const raw = safeStr(value);
  if (!raw) return [];

  return uniqueStrings(
    raw
      .split(/[\n,;]+/)
      .map((item) => safeStr(item))
      .filter(Boolean)
  );
}

function normalizeBoolean(value) {
  if (value === true) return true;
  const raw = toLower(value);
  return raw === "1" || raw === "true" || raw === "yes";
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

export function normalizeUserTokenFilters(filters = {}) {
  return {
    search: safeStr(filters.search),
    city: safeStr(filters.city),
    cityIn: normalizeStringList(filters.cityIn),
    cityNotIn: normalizeStringList(filters.cityNotIn),
    modelFilter: toLower(filters.modelFilter) || "all",
    disabledOnly: normalizeBoolean(filters.disabledOnly),
    missingName: normalizeBoolean(filters.missingName),
    missingCity: normalizeBoolean(filters.missingCity),
  };
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
  const q = toLower(search);
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
  const query = toLower(city);
  if (!query) return true;
  const rowCity = toLower(row.city);
  return rowCity === query || rowCity.includes(query);
}

export function rowMatchesCityIn(row, cityIn) {
  const values = normalizeStringList(cityIn).map(toLower);
  if (values.length === 0) return true;
  const rowCity = toLower(row.city);
  return values.includes(rowCity);
}

export function rowMatchesCityNotIn(row, cityNotIn) {
  const values = normalizeStringList(cityNotIn).map(toLower);
  if (values.length === 0) return true;
  const rowCity = toLower(row.city);
  return !values.includes(rowCity);
}

export function rowMatchesMissingName(row, missingName) {
  if (!normalizeBoolean(missingName)) return true;
  return !hasDisplayName(row);
}

export function rowMatchesMissingCity(row, missingCity) {
  if (!normalizeBoolean(missingCity)) return true;
  return !hasCity(row);
}

export function rowMatchesModelFilter(row, modelFilter) {
  const f = toLower(modelFilter);
  if (!f || f === "all") return true;
  if (f === "legacy") {
    return (
      row.modelClass === "legacy" ||
      row.modelClass === "missing_name" ||
      row.modelClass === "missing_city"
    );
  }
  if (f === "missing_name") return !hasDisplayName(row);
  if (f === "missing_city") return !hasCity(row);
  if (f === "complete") return row.modelClass === "complete";
  return true;
}

export function applyUserTokenFilters(rows, rawFilters = {}) {
  const filters = normalizeUserTokenFilters(rawFilters);
  return rows.filter((row) => {
    if (filters.disabledOnly && !row.disabled) return false;
    if (!rowMatchesSearch(row, filters.search)) return false;
    if (!rowMatchesCity(row, filters.city)) return false;
    if (!rowMatchesCityIn(row, filters.cityIn)) return false;
    if (!rowMatchesCityNotIn(row, filters.cityNotIn)) return false;
    if (!rowMatchesMissingName(row, filters.missingName)) return false;
    if (!rowMatchesMissingCity(row, filters.missingCity)) return false;
    if (!rowMatchesModelFilter(row, filters.modelFilter)) return false;
    return true;
  });
}

export function hasActiveUserTokenFilters(rawFilters = {}) {
  const filters = normalizeUserTokenFilters(rawFilters);
  return Boolean(
    filters.search ||
      filters.city ||
      filters.cityIn.length > 0 ||
      filters.cityNotIn.length > 0 ||
      (filters.modelFilter && filters.modelFilter !== "all") ||
      filters.disabledOnly ||
      filters.missingName ||
      filters.missingCity
  );
}

export function isUserTokenExplicitlyExcluded(rowId, mode, selectedIds = [], excludedIds = []) {
  const selectedSet = new Set(normalizeStringList(selectedIds));
  const excludedSet = new Set(normalizeStringList(excludedIds));
  if (mode === "delete_all_except_selected") {
    return excludedSet.size > 0 ? excludedSet.has(rowId) : selectedSet.has(rowId);
  }
  return excludedSet.has(rowId);
}

export function buildUserTokenBulkDeletePlan(rows, options = {}) {
  const mode = safeStr(options.mode) || "delete_all_except_selected";
  const normalizedSelectedIds = normalizeStringList(options.selectedIds);
  const selectedSet = new Set(normalizedSelectedIds);
  const excludedSet = new Set(normalizeStringList(options.excludedIds));
  const existingIds = new Set(rows.map((row) => row.id));
  const inverseKeepSet =
    mode === "delete_all_except_selected"
      ? new Set(excludedSet.size > 0 ? [...excludedSet] : [...selectedSet])
      : excludedSet;
  const protectedRows = [];
  const selectedRows = [];
  const deletableRows = [];

  rows.forEach((row) => {
    const isSelected = selectedSet.has(row.id);
    const isExcluded = isUserTokenExplicitlyExcluded(
      row.id,
      mode,
      [...selectedSet],
      mode === "delete_all_except_selected" ? [...inverseKeepSet] : [...excludedSet]
    );

    if (isSelected) {
      selectedRows.push(row);
    }

    if (isExcluded) {
      protectedRows.push(row);
    }

    if (mode === "delete_selected") {
      if (isSelected && !isExcluded) {
        deletableRows.push(row);
      }
      return;
    }

    if (!isExcluded) {
      deletableRows.push(row);
    }
  });

  return {
    mode,
    matchedRows: rows,
    selectedRows,
    protectedRows,
    deletableRows,
    collectionCount: rows.length,
    matchedCount: rows.length,
    selectedCount: selectedSet.size,
    excludedCount: protectedRows.length,
    deleteCount: deletableRows.length,
    invalidSelectedCount: normalizedSelectedIds.filter((id) => !existingIds.has(id)).length,
  };
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
