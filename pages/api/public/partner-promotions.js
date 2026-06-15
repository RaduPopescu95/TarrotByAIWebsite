import { readSingleQueryValue } from "../../../lib/courses";
import { setDynamicPublicCacheHeaders } from "../../../lib/httpCache";
import { loadPartnerPromotionsForPlacement } from "../../../lib/partnerPromotions/loadPartnerPromotionsPublic";
import { normalizePartnerPromotionLocale } from "../../../lib/partnerPromotions/partnerPromotions.service";
import { isValidPartnerPromotionZone } from "../../../lib/partnerPromotions/zones";
import { withFirestoreReadTelemetry } from "../../../lib/firestoreCostLogger";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const placementRaw = readSingleQueryValue(req.query.placement);
  const placement = typeof placementRaw === "string" ? placementRaw.trim() : "";
  if (!isValidPartnerPromotionZone(placement)) {
    return res.status(400).json({ error: "Invalid or missing placement" });
  }

  const localeRaw = readSingleQueryValue(req.query.locale);
  const locale = normalizePartnerPromotionLocale(
    typeof localeRaw === "string" ? localeRaw : undefined,
    "ro"
  );

  try {
    const nowMs = Date.now();
    const payload = await loadPartnerPromotionsForPlacement({
      placement,
      locale,
      nowMs,
    });

    const cacheMeta = setDynamicPublicCacheHeaders(res, {
      nowMs,
      nextPublishAtMs: payload.nextChangeAtMs,
      maxAgeSeconds: 300,
      staleWhileRevalidateSeconds: 600,
    });

    return res.status(200).json({
      placement: payload.placement,
      promotions: payload.promotions,
      locale,
      generatedAt: payload.generatedAt,
      cacheTtlSec: cacheMeta.cacheTtlSec,
    });
  } catch (error) {
    console.error("[public.partner-promotions] failed", {
      placement,
      message: error?.message || error,
    });
    return res.status(500).json({ error: "Failed to load partner promotions", promotions: [] });
  }
}

export default withFirestoreReadTelemetry("/api/public/partner-promotions", handler);
