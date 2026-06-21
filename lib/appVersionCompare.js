const APP_VERSION_PATTERN = /^\d+(?:\.\d+){0,2}$/;

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeAppVersion(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || !APP_VERSION_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * @param {string} version
 * @returns {number[]}
 */
function parseAppVersionParts(version) {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

/**
 * Compare two normalized app versions (major.minor.patch style).
 * @param {string} left
 * @param {string} right
 * @returns {-1 | 0 | 1}
 */
export function compareAppVersions(left, right) {
  const leftParts = parseAppVersionParts(left);
  const rightParts = parseAppVersionParts(right);
  const maxLength = Math.max(leftParts.length, rightParts.length, 3);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}
