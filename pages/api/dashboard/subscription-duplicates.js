import Stripe from "stripe";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireDashboardAccess } from "../../../lib/requireAuth";
import { loadPremiumDuplicateReport } from "../../../lib/stripePremiumDuplicates";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    requireDashboardAccess(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: "Unauthorized" });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const report = await loadPremiumDuplicateReport({
      stripe,
      db: getAdminDb(),
    });
    return res.status(200).json(report);
  } catch (error) {
    console.error("[dashboard/subscription-duplicates] GET error", error?.message || error);
    return res.status(500).json({ error: "Failed to load duplicate subscriptions" });
  }
}
