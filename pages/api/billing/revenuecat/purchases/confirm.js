import { getAdminDb } from "../../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../../lib/requireAuth";
import { isRevenueCatFlowEnabled } from "../../../../../lib/billingConfig";
import { verifyAndSyncRevenueCatOneTimePurchase } from "../../../../../lib/revenueCatBilling";

function buildRequestId() {
  return `rcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  const requestId = buildRequestId();
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }
  if (!isRevenueCatFlowEnabled("courses")) {
    return res.status(503).json({ error: "Google Play courses are disabled", requestId });
  }

  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized", requestId });
  }

  const expectedKind =
    req.body?.kind === "bundle" ? "bundle" : req.body?.kind === "course" ? "course" : null;
  if (!expectedKind) {
    return res.status(400).json({ error: "Invalid purchase kind", requestId });
  }

  try {
    const verified = await verifyAndSyncRevenueCatOneTimePurchase({
      db: getAdminDb(),
      uid: decoded.uid,
      productId: req.body?.productId,
      transactionId: req.body?.transactionId,
      expectedKind,
      expectedItemId: req.body?.itemId,
    });
    return res.status(200).json({
      confirmed: true,
      entitlementGranted: verified.result?.entitlementGranted === true,
      kind: verified.mapping.kind,
      itemId: verified.mapping.itemId,
      transactionId: verified.transactionId,
      requestId,
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    console[status >= 500 ? "error" : "warn"](
      "[revenuecat.purchase.confirm] failed",
      {
        requestId,
        uid: decoded.uid,
        status,
        kind: expectedKind,
        itemId: req.body?.itemId || null,
        message: error?.message || "unknown_error",
      }
    );
    return res.status(status).json({
      error: status >= 500 ? "Purchase confirmation failed" : error.message,
      requestId,
    });
  }
}
