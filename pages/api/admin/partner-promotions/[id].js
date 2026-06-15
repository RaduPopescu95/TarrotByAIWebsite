import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../../lib/requireAuth";
import {
  buildPartnerPromotionWritePayload,
  serializePartnerPromotionRow,
  validatePartnerPromotionInput,
} from "../../../../lib/partnerPromotions/partnerPromotions.service";
import {
  clearPartnerPromotionsMemoryCache,
  getPartnerPromotionAdminById,
  rebuildPartnerPromotionsMaterializedCache,
} from "../../../../lib/partnerPromotions/loadPartnerPromotionsPublic";

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

  const rawId = typeof req.query.id === "string" ? req.query.id.trim() : "";
  if (!rawId) {
    return res.status(400).json({ error: "Missing id" });
  }

  const db = getAdminDb();

  if (req.method === "GET") {
    try {
      const promotion = await getPartnerPromotionAdminById(rawId);
      if (!promotion) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ promotion });
    } catch (error) {
      console.error("[admin.partner-promotions.get] failed", error?.message || error);
      return res.status(500).json({ error: "Failed to load partner promotion" });
    }
  }

  if (req.method === "PUT") {
    const validation = validatePartnerPromotionInput(req.body || {}, { partial: true });
    if (!validation.ok) {
      return res.status(400).json({ error: "Invalid payload", fields: validation.errors });
    }

    try {
      const ref = db.collection("partnerPromotions").doc(rawId);
      const existing = await ref.get();
      if (!existing.exists) return res.status(404).json({ error: "Not found" });

      const payload = buildPartnerPromotionWritePayload(req.body || {}, { partial: true });
      if (Object.keys(payload).length <= 1) {
        return res.status(400).json({ error: "No fields to update" });
      }
      await ref.set(payload, { merge: true });
      await rebuildCacheBestEffort();
      const updated = serializePartnerPromotionRow(await ref.get());
      return res.status(200).json({ promotion: updated });
    } catch (error) {
      console.error("[admin.partner-promotions.update] failed", error?.message || error);
      return res.status(500).json({ error: "Failed to update partner promotion" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const ref = db.collection("partnerPromotions").doc(rawId);
      const existing = await ref.get();
      if (!existing.exists) return res.status(404).json({ error: "Not found" });
      await ref.delete();
      await rebuildCacheBestEffort();
      return res.status(204).end();
    } catch (error) {
      console.error("[admin.partner-promotions.delete] failed", error?.message || error);
      return res.status(500).json({ error: "Failed to delete partner promotion" });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
