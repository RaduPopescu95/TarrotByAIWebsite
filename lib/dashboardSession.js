import crypto from "crypto";

export const DASHBOARD_SESSION_COOKIE = "dashboard_session";
export const DASHBOARD_SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;

function dashboardError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw dashboardError(`Missing ${name}`, 503);
  return value;
}

function constantTimeEqual(leftValue, rightValue) {
  const left = crypto
    .createHash("sha256")
    .update(String(leftValue || ""))
    .digest();
  const right = crypto
    .createHash("sha256")
    .update(String(rightValue || ""))
    .digest();
  return crypto.timingSafeEqual(left, right);
}

function signPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", requiredEnv("DASHBOARD_SESSION_SECRET"))
    .update(encodedPayload)
    .digest("base64url");
}

function parseCookies(req) {
  const raw = typeof req?.headers?.cookie === "string" ? req.headers.cookie : "";
  return Object.fromEntries(
    raw
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator < 0) return [part, ""];
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

export function verifyDashboardPassword(password) {
  return constantTimeEqual(password, requiredEnv("DASHBOARD_PASSWORD"));
}

export function createDashboardSession(nowMs = Date.now()) {
  const payload = {
    version: 1,
    issuedAt: nowMs,
    expiresAt: nowMs + DASHBOARD_SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function readDashboardSession(req, nowMs = Date.now()) {
  const token = parseCookies(req)[DASHBOARD_SESSION_COOKIE];
  if (!token) return null;
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return null;
  if (!constantTimeEqual(suppliedSignature, signPayload(encodedPayload))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (
      payload?.version !== 1 ||
      typeof payload?.expiresAt !== "number" ||
      payload.expiresAt <= nowMs
    ) {
      return null;
    }
    return payload;
  } catch (_) {
    return null;
  }
}

function requestOriginMatchesHost(req) {
  const origin = typeof req?.headers?.origin === "string" ? req.headers.origin : "";
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    const originUrl = new URL(origin);
    const forwardedHost = String(
      req.headers?.["x-forwarded-host"] || req.headers?.host || ""
    )
      .split(",")[0]
      .trim()
      .toLowerCase();
    return Boolean(forwardedHost && originUrl.host.toLowerCase() === forwardedHost);
  } catch (_) {
    return false;
  }
}

export function requireDashboardMutationOrigin(req) {
  if (!requestOriginMatchesHost(req)) {
    throw dashboardError("Origine dashboard invalidă", 403);
  }
}

export function requireDashboardSession(req, { mutation = false } = {}) {
  const session = readDashboardSession(req);
  if (!session) throw dashboardError("Acces dashboard necesar", 401);
  if (mutation) requireDashboardMutationOrigin(req);
  return session;
}

export function dashboardSessionCookie(token) {
  const attributes = [
    `${DASHBOARD_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${DASHBOARD_SESSION_TTL_SECONDS}`,
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  return attributes.join("; ");
}

export function clearDashboardSessionCookie() {
  const attributes = [
    `${DASHBOARD_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  return attributes.join("; ");
}
