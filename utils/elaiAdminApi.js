import { authentication } from "../firebase";

function getDashboardAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dashboard_access_token");
  } catch (_) {
    return null;
  }
}

async function getIdTokenOptional() {
  const user = authentication.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

async function adminRequest(url, payload = {}) {
  const token = await getIdTokenOptional();
  const dashboardToken = getDashboardAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(dashboardToken ? { "X-Dashboard-Access": dashboardToken } : {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export async function postElaiStatusSync(payload) {
  return await adminRequest("/api/admin/elai/status-sync", payload);
}

export async function postElaiRerender(payload) {
  return await adminRequest("/api/admin/elai/rerender", payload);
}
