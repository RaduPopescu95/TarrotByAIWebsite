import { readSingleQueryValue } from "../../../lib/courses";
import { explainPremiumAccess } from "../../../lib/explainPremiumAccess";
import { loadMobileUserProfile } from "../../../lib/loadMobileUserProfile";
import { auditUserPremiumFields } from "../../../lib/premiumVideoAccessAudit";
import { requireAuth } from "../../../lib/requireAuth";

function buildRequestId() {
  return `mobile_me_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const isFreshRequest = (query) => {
  const raw = readSingleQueryValue(query?.fresh);
  if (raw === undefined || raw === null || raw === "") return false;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const decoded = await requireAuth(req);
    const uid = decoded?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized", requestId });
    }

    const fresh = isFreshRequest(req.query);
    if (fresh) {
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
    } else {
      res.setHeader("Cache-Control", "private, max-age=30");
    }

    const { user, source } = await loadMobileUserProfile(uid, { fresh });

    if (!user) {
      return res.status(404).json({
        error: "User profile not found",
        user: null,
        source: null,
        requestId,
      });
    }

    const accessExplain = explainPremiumAccess(user);
    auditUserPremiumFields(uid, user, {
      stage: "mobile_me",
      requestId,
      source,
      fresh,
    });

    return res.status(200).json({
      user,
      source,
      requestId,
      generatedAt: new Date().toISOString(),
      premiumAccess: {
        hasAccess: accessExplain.hasAccess,
        reason: accessExplain.reason,
        snapshot: accessExplain.snapshot,
        checkedAt: accessExplain.now,
      },
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    if (statusCode === 401) {
      return res.status(401).json({
        error: error?.message || "Unauthorized",
        requestId,
      });
    }

    console.error("[mobile/me] GET error", {
      requestId,
      message: error?.message || String(error),
    });
    return res.status(500).json({
      error: "Failed to load user profile",
      requestId,
    });
  }
}
