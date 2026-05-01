/**
 * Public video library ordering (mirror of admin sortVideos semantics).
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

export function sortVideoDocsForPublic(items) {
  return [...items].sort((a, b) => {
    const aHasOrder = typeof a.order === "number";
    const bHasOrder = typeof b.order === "number";
    if (aHasOrder && bHasOrder) {
      if (a.order !== b.order) return a.order - b.order;
    } else if (aHasOrder !== bHasOrder) {
      return aHasOrder ? -1 : 1;
    }
    return timestampToMs(b.createdAt) - timestampToMs(a.createdAt);
  });
}
