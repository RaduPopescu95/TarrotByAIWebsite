function getDashboardAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dashboard_access_token");
  } catch (_) {
    return null;
  }
}

async function apiRequest(url, options = {}) {
  const dashboardToken = getDashboardAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(dashboardToken ? { "X-Dashboard-Access": dashboardToken } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Eroare necunoscută");
  }
  return data;
}

export async function fetchAdminPartnerPromotions() {
  const data = await apiRequest("/api/admin/partner-promotions", { method: "GET" });
  return {
    promotions: data?.promotions || [],
    zones: data?.zones || {},
  };
}

export async function createAdminPartnerPromotion(payload) {
  const data = await apiRequest("/api/admin/partner-promotions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.promotion || null;
}

export async function updateAdminPartnerPromotion(id, payload) {
  const data = await apiRequest(`/api/admin/partner-promotions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data?.promotion || null;
}

export async function deleteAdminPartnerPromotion(id) {
  await apiRequest(`/api/admin/partner-promotions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function rebuildPartnerPromotionsCache() {
  return apiRequest("/api/admin/partner-promotions-cache/rebuild", { method: "POST" });
}
