import crypto from "crypto";
import { getBillingConfig } from "./billingConfig";

const SENSITIVE_KEY = /authorization|token|secret|apikey|api_key|signature|client_secret|ephemeral/i;
const PII_KEY = /email|phone|first.?name|last.?name|line1|address|postal|cnp|cif/i;
const UID_KEY = /^(uid|app_user_id|owneruid)$/i;
const TRANSACTION_KEY = /transaction.?id|original_transaction_id/i;
const MAX_DEPTH = 4;

export const BILLING_ERROR_CODES = Object.freeze({
  AUTH_MISSING: "auth_missing",
  METHOD_NOT_ALLOWED: "method_not_allowed",
  INVALID_PAYLOAD: "invalid_payload",
  FLOW_DISABLED: "flow_disabled",
  CONFIG_LOAD_FAILED: "config_load_failed",
  INVALID_APP_USER_ID: "invalid_app_user_id",
  UNMAPPED_PRODUCT: "unmapped_product",
  ALREADY_PROCESSED: "already_processed",
  PRODUCT_TYPE_MISMATCH: "product_type_mismatch",
  PURCHASE_NOT_VERIFIED: "purchase_not_verified",
  ENTITLEMENT_CONFLICT: "entitlement_conflict",
  SUBSCRIBER_NOT_FOUND: "subscriber_not_found",
  UPSTREAM_REVENUECAT: "upstream_revenuecat",
  PROCESSING_FAILED: "processing_failed",
});

export function buildBillingRequestId(scope = "billing") {
  return `${scope}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

export function getBillingRequestId(req, scope = "billing") {
  const incoming = String(req?.headers?.["x-request-id"] || "").trim().slice(0, 128);
  return incoming || buildBillingRequestId(scope);
}

export function setBillingRequestId(res, requestId) {
  res?.setHeader?.("X-Request-Id", requestId);
  return requestId;
}

export function maskUid(value) {
  const uid = String(value || "").trim();
  if (!uid) return null;
  if (uid.length <= 6) return "***";
  return `${uid.slice(0, 3)}…${uid.slice(-3)}`;
}

export function maskTransactionId(value) {
  const id = String(value || "").trim();
  if (!id) return null;
  if (id.length <= 6) return "***";
  return `…${id.slice(-6)}`;
}

export function redactBillingPayload(value, depth = 0) {
  if (depth > MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactBillingPayload(item, depth + 1));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      if (/^has[A-Z]/.test(key) && typeof child === "boolean") return [[key, child]];
      if (SENSITIVE_KEY.test(key) || PII_KEY.test(key)) return [];
      if (UID_KEY.test(key)) return [[key, maskUid(child)]];
      if (TRANSACTION_KEY.test(key)) return [[key, maskTransactionId(child)]];
      return [[key, redactBillingPayload(child, depth + 1)]];
    })
  );
}

export function categorizeBillingError({ statusCode, message, reason } = {}) {
  const text = `${reason || ""} ${message || ""}`.toLowerCase();
  if (statusCode === 401 || text.includes("unauthorized")) return BILLING_ERROR_CODES.AUTH_MISSING;
  if (statusCode === 405) return BILLING_ERROR_CODES.METHOD_NOT_ALLOWED;
  if (text.includes("missing") || text.includes("invalid")) return BILLING_ERROR_CODES.INVALID_PAYLOAD;
  if (text.includes("disabled") || text.includes("not configured")) {
    return BILLING_ERROR_CODES.FLOW_DISABLED;
  }
  if (text.includes("already processed")) return BILLING_ERROR_CODES.ALREADY_PROCESSED;
  if (text.includes("unmapped") || text.includes("not mapped")) return BILLING_ERROR_CODES.UNMAPPED_PRODUCT;
  if (text.includes("not yet verified")) return BILLING_ERROR_CODES.PURCHASE_NOT_VERIFIED;
  if (text.includes("does not match") || text.includes("mismatch")) {
    return BILLING_ERROR_CODES.PRODUCT_TYPE_MISMATCH;
  }
  if (text.includes("belongs to another") || text.includes("already bound")) {
    return BILLING_ERROR_CODES.ENTITLEMENT_CONFLICT;
  }
  if (statusCode === 404 || text.includes("subscriber not found")) {
    return BILLING_ERROR_CODES.SUBSCRIBER_NOT_FOUND;
  }
  if (statusCode === 502 || text.includes("revenuecat")) {
    return BILLING_ERROR_CODES.UPSTREAM_REVENUECAT;
  }
  return BILLING_ERROR_CODES.PROCESSING_FAILED;
}

export function getSafeBillingConfigSnapshot(settings = {}) {
  const config = getBillingConfig();
  const describe = (flow, rolloutSetting) => {
    const row = config.android[flow] || {};
    const rollout = settings?.[rolloutSetting] === "revenuecat" ? "revenuecat" : "stripe";
    const selectedProvider =
      row.enabled === true && row.provider === "revenuecat" && rollout === "revenuecat"
        ? "revenuecat"
        : "stripe";
    return {
      envEnabled: row.enabled === true,
      envProvider: row.provider || "stripe",
      rollout,
      selectedProvider,
    };
  };

  return {
    iosPremiumSubscriptionsEnabled:
      settings?.iosPremiumSubscriptionsEnabled ?? settings?.subscriptionSystemEnabled !== false,
    subscriptionSystemEnabled:
      settings?.iosPremiumSubscriptionsEnabled ?? settings?.subscriptionSystemEnabled !== false,
    premium: {
      ...describe("premium", "androidBillingPremiumProvider"),
      rollout: "revenuecat",
      selectedProvider: "revenuecat",
    },
    analyses: {
      ...describe("analyses", "androidBillingAnalysesProvider"),
      configuredProductCount: Object.values(config.android.analyses?.productIds || {}).filter(Boolean)
        .length,
    },
    courses: { envEnabled: false, envProvider: "stripe", rollout: "stripe", selectedProvider: "stripe" },
    hasRevenueCatApiKey: Boolean(process.env.REVENUECAT_SECRET_API_KEY),
    hasRevenueCatWebhookToken: Boolean(process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN),
    hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
  };
}

export function logBillingObs({ level = "info", scope, stage, requestId, ...context }) {
  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  const entry = redactBillingPayload({
    tag: "BILLING_OBS",
    v: 1,
    ts: new Date().toISOString(),
    level,
    scope,
    stage,
    requestId,
    ...context,
  });
  logger("[BILLING_OBS]", JSON.stringify(entry));
  return entry;
}
