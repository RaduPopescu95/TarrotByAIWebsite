import Stripe from "stripe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { hasPremiumAccess, currentPeriodEndToMillis } from "../../../lib/premiumAccess";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";

function tsToIso(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    if (typeof value.toMillis === "function") return new Date(value.toMillis()).toISOString();
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
    if (typeof value._seconds === "number") return new Date(value._seconds * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
  } catch (_) {}
  return null;
}

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

function mapDocToSubscriber(docSnap) {
  const d = docSnap.data() || {};
  const isPremium = hasPremiumAccess(d);
  const isManual = d.subscriptionProvider === "manual";
  const hasEverHadSubscription =
    !!d.stripeSubscriptionId ||
    !!d.subscriptionStatus ||
    isManual ||
    d.manualPremiumGrantedAt != null;
  if (!isPremium && !hasEverHadSubscription) return null;
  const endMs = currentPeriodEndToMillis(d.currentPeriodEnd);
  const manualEndMs = currentPeriodEndToMillis(d.manualPremiumExpiresAt);
  return {
    uid: docSnap.id,
    email: safeStr(d.email),
    firstName: safeStr(d.first_name),
    lastName: safeStr(d.last_name),
    premium: isPremium,
    isManual,
    subscriptionStatus: safeStr(d.subscriptionStatus),
    subscriptionProvider: safeStr(d.subscriptionProvider),
    stripeSubscriptionId: safeStr(d.stripeSubscriptionId),
    stripeCustomerId: safeStr(d.stripeCustomerId),
    cancelAtPeriodEnd: d.premiumSubscriptionCancelAtPeriodEnd === true,
    currentPeriodEnd: endMs ? new Date(endMs).toISOString() : null,
    manualPremiumExpiresAt: manualEndMs ? new Date(manualEndMs).toISOString() : null,
    billingType: safeStr(d.premiumBillingProfile?.billing?.billingType),
    invoiceSendEmail: d.premiumBillingProfile?.billing?.invoicePreferences?.sendEmail !== false,
    billingName: safeStr(
      d.premiumBillingProfile?.billing?.individual?.fullName ||
        d.premiumBillingProfile?.billing?.company?.companyName,
    ),
    billingCountry: safeStr(d.premiumBillingProfile?.normalizedBeforeCheckout?.country),
    updatedAt: tsToIso(d.updatedAt),
  };
}

async function cancelStripeSubscriptionIfNeeded(subscriptionId) {
  if (!subscriptionId || typeof subscriptionId !== "string") return { canceled: false, skipped: true };
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return { canceled: true, skipped: false };
  } catch (err) {
    const code = err?.code || err?.type;
    const msg = err?.message || String(err);
    if (code === "resource_missing" || /No such subscription/i.test(msg)) {
      return { canceled: false, skipped: false, alreadyGone: true };
    }
    throw err;
  }
}

async function clearPremiumFieldsOnUser(db, uid) {
  await db.collection("Users").doc(uid).set(
    {
      premium: false,
      subscriptionStatus: FieldValue.delete(),
      subscriptionProvider: FieldValue.delete(),
      stripeSubscriptionId: FieldValue.delete(),
      stripeCustomerId: FieldValue.delete(),
      currentPeriodEnd: FieldValue.delete(),
      premiumSubscriptionCancelAtPeriodEnd: FieldValue.delete(),
      premiumBillingProfile: FieldValue.delete(),
      manualPremiumGrantedAt: FieldValue.delete(),
      manualPremiumExpiresAt: FieldValue.delete(),
      manualPremiumNote: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Find Users doc by Firebase uid (doc id), owner_uid, or email.
 * @returns {{ ref: FirebaseFirestore.DocumentReference, id: string, data: object } | null | { ambiguous: true, count?: number }}
 */
async function resolveUserDocument(db, { uid, email }) {
  const u = typeof uid === "string" ? uid.trim() : "";
  const emRaw = typeof email === "string" ? email.trim() : "";
  if (u) {
    const byId = await db.collection("Users").doc(u).get();
    if (byId.exists) {
      return { ref: byId.ref, id: byId.id, data: byId.data() || {} };
    }
    const qOwner = await db.collection("Users").where("owner_uid", "==", u).limit(5).get();
    if (!qOwner.empty) {
      if (qOwner.size > 1) return { ambiguous: true, count: qOwner.size };
      const doc = qOwner.docs[0];
      return { ref: doc.ref, id: doc.id, data: doc.data() || {} };
    }
  }
  if (emRaw) {
    const qMail = await db.collection("Users").where("email", "==", emRaw).limit(10).get();
    if (qMail.empty) {
      const lower = emRaw.toLowerCase();
      if (lower !== emRaw) {
        const q2 = await db.collection("Users").where("email", "==", lower).limit(10).get();
        if (!q2.empty) {
          if (q2.size > 1) return { ambiguous: true, count: q2.size };
          const doc = q2.docs[0];
          return { ref: doc.ref, id: doc.id, data: doc.data() || {} };
        }
      }
      return null;
    }
    if (qMail.size > 1) return { ambiguous: true, count: qMail.size };
    const doc = qMail.docs[0];
    return { ref: doc.ref, id: doc.id, data: doc.data() || {} };
  }
  return null;
}

export default async function handler(req, res) {
  const token = req.headers["x-dashboard-token"] || "";
  if (token !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const db = getAdminDb();
      const snap = await db.collection("Users").get();
      const subscribers = [];
      snap.forEach((docSnap) => {
        const row = mapDocToSubscriber(docSnap);
        if (row) subscribers.push(row);
      });
      subscribers.sort((a, b) => {
        if (!a.updatedAt && !b.updatedAt) return 0;
        if (!a.updatedAt) return 1;
        if (!b.updatedAt) return -1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
      return res.status(200).json({ subscribers, total: subscribers.length });
    } catch (err) {
      console.error("[dashboard/subscribers] GET error", err?.message || err);
      return res.status(500).json({ error: "Failed to load subscribers" });
    }
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const action = typeof body.action === "string" ? body.action : "remove";

    try {
      const db = getAdminDb();

      if (action === "grant_manual") {
        const { uid: uidIn, email: emailIn, months, note, silent } = body;
        if (!uidIn && !emailIn) {
          return res.status(400).json({ error: "Provide uid or email" });
        }

        const resolved = await resolveUserDocument(db, { uid: uidIn, email: emailIn });
        if (resolved?.ambiguous) {
          return res.status(400).json({
            error: "ambiguous_user",
            message: "Mai mulți utilizatori găsiți. Folosește UID-ul exact din Firebase Auth.",
            count: resolved.count,
          });
        }
        if (!resolved) {
          return res.status(404).json({ error: "User not found" });
        }

        const { ref, id, data } = resolved;
        const stripeSub = typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId.trim() : "";
        /** Nu acoperim peste acces încă activ; permitem dacă e expirat/fără acces dar a rămas vechiul sub id în Firestore. */
        const stillPaidStripeAccess =
          stripeSub &&
          hasPremiumAccess(data) &&
          data.subscriptionProvider !== "manual";
        if (stillPaidStripeAccess) {
          return res.status(409).json({
            error: "stripe_subscription_active",
            message:
              "Are încă acces premium (inclusiv prin Stripe). Folosește „Șterge” pe rând sau anulează în Stripe înainte de a acorda manual.",
          });
        }

        let expiresField = FieldValue.delete();
        const m = typeof months === "number" ? months : parseInt(String(months ?? ""), 10);
        if (Number.isFinite(m) && m > 0) {
          expiresField = Timestamp.fromMillis(Date.now() + m * 30 * 24 * 60 * 60 * 1000);
        }

        let noteField;
        if (silent === true) {
          noteField = FieldValue.delete();
        } else if (typeof note === "string" && note.trim()) {
          noteField = note.trim().slice(0, 500);
        } else {
          noteField = FieldValue.delete();
        }

        await ref.set(
          {
            premium: true,
            subscriptionProvider: "manual",
            subscriptionStatus: "active",
            stripeSubscriptionId: FieldValue.delete(),
            premiumSubscriptionCancelAtPeriodEnd: FieldValue.delete(),
            currentPeriodEnd: FieldValue.delete(),
            manualPremiumGrantedAt: FieldValue.serverTimestamp(),
            manualPremiumExpiresAt: expiresField,
            manualPremiumNote: noteField,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return res.status(200).json({ ok: true, uid: id, granted: true });
      }

      const { uid, confirmActiveRevocation } = body;
      if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
        return res.status(400).json({ error: "Missing uid" });
      }
      const userId = uid.trim();

      const ref = db.collection("Users").doc(userId);
      const docSnap = await ref.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const data = docSnap.data() || {};
      const wasPremium = hasPremiumAccess(data);
      const isStripe = data.subscriptionProvider === "stripe";
      const subId = typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId.trim() : "";

      if (wasPremium && confirmActiveRevocation !== true) {
        return res.status(400).json({
          error: "active_revocation_not_confirmed",
          message: "Confirmați explicit ștergerea pentru utilizatorul cu abonament activ.",
        });
      }

      let stripeResult = null;
      if (isStripe && subId) {
        stripeResult = await cancelStripeSubscriptionIfNeeded(subId);
      }

      await clearPremiumFieldsOnUser(db, userId);

      return res.status(200).json({
        ok: true,
        uid,
        stripe: stripeResult,
        hadActivePremium: wasPremium,
      });
    } catch (err) {
      console.error("[dashboard/subscribers] POST error", err?.message || err);
      return res.status(500).json({
        error: action === "grant_manual" ? "Failed to grant manual premium" : "Failed to remove subscriber",
        detail: process.env.NODE_ENV === "development" ? err?.message : undefined,
      });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
