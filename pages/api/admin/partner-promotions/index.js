import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  buildPartnerPromotionWritePayload,
  serializePartnerPromotionRow,
  validatePartnerPromotionInput,
} from "../../../../lib/partnerPromotions/partnerPromotions.service";
import {
  clearPartnerPromotionsMemoryCache,
  listAllPartnerPromotionsAdmin,
  rebuildPartnerPromotionsMaterializedCache,
} from "../../../../lib/partnerPromotions/loadPartnerPromotionsPublic";
import { PARTNER_PROMOTION_ZONES } from "../../../../lib/partnerPromotions/zones";

async function rebuildCacheBestEffort() {
  try {
    clearPartnerPromotionsMemoryCache();
    await rebuildPartnerPromotionsMaterializedCache();
  } catch (error) {
    console.warn("[admin.partner-promotions] cache rebuild failed", error?.message || error);
  }
}

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: error.message || "Unauthorized" });
  }

  const db = getAdminDb();

  if (req.method === "GET") {
    try {
      const promotions = await listAllPartnerPromotionsAdmin();
      return res.status(200).json({
        promotions,
        zones: PARTNER_PROMOTION_ZONES,
      });
    } catch (error) {
      console.error("[admin.partner-promotions.list] failed", error?.message || error);
      return res.status(500).json({ error: "Failed to load partner promotions" });
    }
  }

  if (req.method === "POST") {
    const validation = validatePartnerPromotionInput(req.body || {});
    if (!validation.ok) {
      return res.status(400).json({ error: "Invalid payload", fields: validation.errors });
    }

    try {
      const payload = buildPartnerPromotionWritePayload(req.body || {});
      payload.createdAt = Timestamp.now();
      if (payload.isActive === undefined) payload.isActive = true;
      const ref = await db.collection("partnerPromotions").add(payload);
      await rebuildCacheBestEffort();
      const snap = await ref.get();
      const promotion = serializePartnerPromotionRow(snap);
      return res.status(201).json({ promotion });
    } catch (error) {
      console.error("[admin.partner-promotions.create] failed", error?.message || error);
      return res.status(500).json({ error: "Failed to create partner promotion" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
