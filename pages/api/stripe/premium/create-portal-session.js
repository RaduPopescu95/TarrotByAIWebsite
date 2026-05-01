import Stripe from "stripe";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/requireAuth";
import { resolvePremiumPublicBaseUrl } from "../../../../lib/premiumServerUtils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err) {
    const code = err.statusCode || 401;
    return res.status(code).json({ error: err.message || "Unauthorized" });
  }

  const baseUrl = resolvePremiumPublicBaseUrl(req);
  if (!baseUrl) {
    return res.status(500).json({ error: "Missing site URL configuration" });
  }

  const uid = authUser.uid;
  const db = getAdminDb();
  let stripeCustomerId = null;
  try {
    const snap = await db.collection("Users").doc(uid).get();
    if (snap.exists) {
      const c = snap.data()?.stripeCustomerId;
      if (typeof c === "string" && c.trim()) {
        stripeCustomerId = c.trim();
      }
    }
  } catch (e) {
    console.warn("[premium.portal] user_read_failed", { message: e?.message });
  }

  if (!stripeCustomerId) {
    return res.status(400).json({
      error: "No Stripe customer on file. Subscribe first to manage billing.",
    });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });
    if (!portalSession?.url) {
      return res.status(500).json({ error: "Portal session missing URL" });
    }
    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("[premium.portal] stripe_error", { message: err?.message });
    return res.status(500).json({ error: "Could not open billing portal" });
  }
}
