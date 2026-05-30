import { resolvePremiumPublicBaseUrl } from "./premiumServerUtils";

function normalizeBaseUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(/\/+$/, "");
}

export function resolveServerApiBaseUrl(req) {
  const fromPremiumResolver = normalizeBaseUrl(resolvePremiumPublicBaseUrl(req));
  if (fromPremiumResolver) return fromPremiumResolver;

  const fromPublicBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  if (fromPublicBase) return fromPublicBase;

  const fromVercel = normalizeBaseUrl(process.env.VERCEL_URL);
  if (fromVercel) return fromVercel.startsWith("http") ? fromVercel : `https://${fromVercel}`;

  return "http://127.0.0.1:3000";
}

function buildQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    params.append(key, String(value));
  });
  const str = params.toString();
  return str ? `?${str}` : "";
}

export async function fetchServerApiJson(req, path, query = {}, init = {}) {
  const baseUrl = resolveServerApiBaseUrl(req);
  const url = `${baseUrl}${path}${buildQueryString(query)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : `Request failed (${response.status}) for ${path}`;
    const error = new Error(message);
    error.status = response.status;
    error.url = url;
    error.payload = payload;
    throw error;
  }
  return payload;
}

