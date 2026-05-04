/**
 * Public video library ordering: newest upload first (createdAt desc).
 * Manual `order` from admin is ignored here so /videouri and related clips stay chronological for every filter.
 */

function timestampToMs(value) {
  if (!value) return 0;
  try {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    if (typeof value._seconds === "number") return value._seconds * 1000;
  } catch (_) {}
  return 0;
}

/** Firestore upload / recency key for sorting (prefer createdAt). */
function rowNewestFirstMs(row) {
  const created = timestampToMs(row?.createdAt);
  if (created > 0) return created;
  return timestampToMs(row?.updatedAt);
}

export function sortVideoDocsForPublic(items) {
  return [...items].sort((a, b) => rowNewestFirstMs(b) - rowNewestFirstMs(a));
}
