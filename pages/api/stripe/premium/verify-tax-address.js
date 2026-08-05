import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/requireAuth";
import { assessStripeCustomerTaxAddress } from "../../../../lib/premiumTaxAddressGate";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function findUserDocument(db, uid) {
  const directRef = db.collection("Users").doc(uid);
  const direct = await directRef.get();
  if (direct.exists) return { ref: directRef, data: direct.data() || {} };

  const byOwner = await db.collection("Users").where("owner_uid", "==", uid).limit(2).get();
  if (byOwner.docs.length !== 1) return null;
  return { ref: byOwner.docs[0].ref, data: byOwner.docs[0].data() || {} };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ error: error?.message || "Unauthorized" });
  }

  try {
    const db = getAdminDb();
    const user = await findUserDocument(db, authUser.uid);
    if (!user) return res.status(404).json({ error: "User profile not found" });

    const customerId =
      typeof user.data.stripeCustomerId === "string" ? user.data.stripeCustomerId.trim() : "";
    if (!customerId) return res.status(400).json({ error: "Stripe customer is missing" });

    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      return res.status(409).json({ error: "Stripe customer is unavailable" });
    }

    const assessment = assessStripeCustomerTaxAddress(customer);
    if (!assessment.complete) {
      console.info("[premium.tax-address-gate] address_incomplete", {
        uid: authUser.uid,
        reasons: assessment.reasons,
      });
      return res.status(409).json({
        complete: false,
        reasons: assessment.reasons,
        error: "Billing address is still incomplete",
      });
    }

    await user.ref.set(
      {
        premiumTaxAddressGate: {
          required: false,
          readyForMigration: true,
          verifiedAt: FieldValue.serverTimestamp(),
          version: 1,
        },
      },
      { merge: true }
    );

    console.info("[premium.tax-address-gate] address_verified", { uid: authUser.uid });
    return res.status(200).json({ complete: true, readyForMigration: true });
  } catch (error) {
    console.error("[premium.tax-address-gate] verification_failed", {
      uid: authUser.uid,
      message: String(error?.message || "unknown_error").slice(0, 300),
    });
    return res.status(500).json({ error: "Could not verify billing address" });
  }
}

