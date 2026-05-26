export const DEFAULT_ISR_REVALIDATE_SECONDS = 300;

const isEnabled = () => process.env.FIRESTORE_COST_LOGS === "true";

const getDocsRead = (result, fallback = 0) => {
  if (typeof result?.size === "number") return result.size;
  if (typeof result?.exists === "function") return result.exists() ? 1 : 0;
  if (Array.isArray(result?.docs)) return result.docs.length;
  if (Array.isArray(result)) return result.length;
  return fallback;
};

export function logFirestoreCost({
  page,
  locale,
  queryName,
  docsRead = 0,
  queryCount = 1,
  durationMs = 0,
  isrRevalidateSeconds = DEFAULT_ISR_REVALIDATE_SECONDS,
  error,
}) {
  if (!isEnabled()) return;

  console.warn("[FirestoreCost]", {
    page,
    locale: locale || "ro",
    queryName,
    docsRead,
    queryCount,
    durationMs,
    isrRevalidateSeconds,
    error: error ? String(error?.message || error) : undefined,
  });
}

export async function withFirestoreCostLog(meta, operation) {
  const startedAt = Date.now();
  try {
    const result = await operation();
    logFirestoreCost({
      ...meta,
      docsRead: getDocsRead(result, meta.docsRead),
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logFirestoreCost({
      ...meta,
      docsRead: 0,
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
}
