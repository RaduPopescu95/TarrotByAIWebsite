export async function rebuildPublicTarotCache() {
  if (typeof window === "undefined") return;

  const dashboardAccessToken = window.localStorage.getItem("dashboard_access_token");
  const response = await fetch("/api/admin/public-tarot-cache/rebuild", {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(dashboardAccessToken ? { "X-Dashboard-Access": dashboardAccessToken } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || data?.message || "Failed to rebuild public tarot cache.");
  }
}

export async function rebuildPublicTarotCacheAfterMutation(action = "update") {
  try {
    await rebuildPublicTarotCache();
    return true;
  } catch (error) {
    console.error(`[publicTarotCache] Failed to rebuild after ${action}`, error);
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(
        "Modificarile au fost salvate, dar actualizarea cache-ului public a esuat. Ruleaza rebuild-ul cache-ului public din dashboard."
      );
    }
    return false;
  }
}
