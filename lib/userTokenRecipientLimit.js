export const DEFAULT_RECIPIENT_LIMIT_CITIES = ["Iași", "Târgoviște"];
export const DEFAULT_RECIPIENT_LIMIT_NAMES = ["Cristina", "Tarot Soare și Lună"];

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeRecipientMatchText(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStringList(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,;]+/)
      : [];
  const normalized = [];
  const seen = new Set();

  source.forEach((item) => {
    const displayValue = safeString(item);
    const matchValue = normalizeRecipientMatchText(displayValue);
    if (!displayValue || !matchValue || seen.has(matchValue)) return;
    seen.add(matchValue);
    normalized.push(displayValue);
  });

  return normalized;
}

export function normalizeRecipientLimitCriteria(criteria = {}, options = {}) {
  const useDefaults = options.useDefaults !== false;
  const hasCities = Array.isArray(criteria.cities) || typeof criteria.cities === "string";
  const hasNames = Array.isArray(criteria.names) || typeof criteria.names === "string";
  if (useDefaults && !hasCities && !hasNames) {
    return {
      cities: [...DEFAULT_RECIPIENT_LIMIT_CITIES],
      names: [...DEFAULT_RECIPIENT_LIMIT_NAMES],
    };
  }
  return {
    cities: normalizeStringList(criteria.cities),
    names: normalizeStringList(criteria.names),
  };
}

export function matchUserTokenRecipient(data, rawCriteria = {}) {
  const criteria = normalizeRecipientLimitCriteria(rawCriteria);
  const normalizedCity = normalizeRecipientMatchText(data?.city);
  const normalizedName = normalizeRecipientMatchText(data?.displayName);
  const cityMatches = criteria.cities.map(normalizeRecipientMatchText).filter(Boolean);
  const nameMatches = criteria.names.map(normalizeRecipientMatchText).filter(Boolean);
  const matchedCity = normalizedCity
    ? cityMatches.find((value) => value === normalizedCity) || ""
    : "";
  const matchedName = normalizedName
    ? nameMatches.find((value) => normalizedName.includes(value)) || ""
    : "";
  const reasons = [];
  if (matchedCity) reasons.push("city");
  if (matchedName) reasons.push("name");

  return {
    matches: reasons.length > 0,
    reasons,
    matchedCity,
    matchedName,
    normalizedCity,
    normalizedName,
  };
}
