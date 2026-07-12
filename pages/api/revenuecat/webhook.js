import { getAdminDb } from "../../../lib/firebaseAdmin";
import {
  getRevenueCatEvent,
  isAuthorizedRevenueCatWebhook,
  processRevenueCatEvent,
} from "../../../lib/revenueCatBilling";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (
    !isAuthorizedRevenueCatWebhook(
      req.headers?.authorization,
      process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN
    )
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const event = getRevenueCatEvent(req.body);
  if (!event) return res.status(400).json({ error: "Invalid webhook payload" });

  try {
    const result = await processRevenueCatEvent(getAdminDb(), event);
    console.info("[revenuecat.webhook] processed", {
      eventId: event.id,
      eventType: event.type,
      result: result?.reason || result?.kind || "processed",
      skipped: result?.skipped === true,
    });
    return res.status(200).json({
      received: true,
      duplicate: result?.reason === "already_processed",
    });
  } catch (error) {
    console.error("[revenuecat.webhook] processing_failed", {
      eventId: event.id,
      eventType: event.type,
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
