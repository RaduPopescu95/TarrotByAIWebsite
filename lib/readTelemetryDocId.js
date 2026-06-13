/**
 * Server replica of doc-id helpers from
 * `expo-mobile-app/src/utils/firestoreReadTelemetry.js`.
 *
 * Both files MUST stay byte-for-byte equivalent (same djb2 hash, same
 * sanitize regex, same `{date}__{uid}__{screen}__{hash}` format) so writes
 * coming from the API and direct writes from older Expo clients converge on
 * the same Firestore document and accumulate via `FieldValue.increment`.
 */

const normalizeTelemetryText = (value) =>
  typeof value === "string" ? value.trim() : "";

const hashTelemetryValue = (value) => {
  let hash = 5381;
  const normalizedValue = String(value || "");
  for (let index = 0; index < normalizedValue.length; index += 1) {
    hash = (hash * 33) ^ normalizedValue.charCodeAt(index);
  }
  return Math.abs(hash >>> 0).toString(36);
};

const sanitizeDocIdPart = (value, fallback = "unknown") => {
  const normalizedValue = normalizeTelemetryText(String(value || fallback));
  const sanitizedValue = normalizedValue.replace(/[^a-zA-Z0-9_-]/g, "_");
  return sanitizedValue.slice(0, 80) || fallback;
};

export function buildAggregateDocId(aggregate) {
  const screenName = aggregate?.screenName;
  const uid = aggregate?.uid;
  const date = aggregate?.date;
  const collectionPathPattern = aggregate?.collectionPathPattern;

  const screenPart = sanitizeDocIdPart(screenName, "unknown");
  const uidPart = sanitizeDocIdPart(uid, "no_uid");
  const patternHash = hashTelemetryValue(
    `${screenName}|${collectionPathPattern}`
  );
  return `${date}__${uidPart}__${screenPart}__${patternHash}`;
}

export const _internal = {
  normalizeTelemetryText,
  hashTelemetryValue,
  sanitizeDocIdPart,
};
