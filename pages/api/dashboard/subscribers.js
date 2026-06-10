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

function userGrantSnapshot(data, docId) {
  const d = data || {};
  return {
    uid: docId || null,
    email: safeStr(d.email) || null,
    owner_uid: safeStr(d.owner_uid) || null,
    premium: d.premium === true,
    subscriptionProvider: safeStr(d.subscriptionProvider) || null,
    subscriptionStatus: safeStr(d.subscriptionStatus) || null,
    hasPremiumAccess: hasPremiumAccess(d),
    stripeSubscriptionId: safeStr(d.stripeSubscriptionId) || null,
    manualPremiumGrantedAt: tsToIso(d.manualPremiumGrantedAt),
    manualPremiumExpiresAt: tsToIso(d.manualPremiumExpiresAt),
  };
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

async function loadSubscriberUserDocs(db) {
  const users = db.collection("Users");
  const subscriberQueries = [
    users.where("premium", "==", true),
    users.where("subscriptionProvider", "==", "manual"),
    users.where("stripeSubscriptionId", ">", ""),
    users.where("manualPremiumGrantedAt", ">", Timestamp.fromMillis(0)),
    users.where("subscriptionStatus", "in", [
      "active",
      "trialing",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ]),
  ];

  const snapshots = await Promise.all(
    subscriberQueries.map(async (subscriberQuery) => {
      try {
        return await subscriberQuery.get();
      } catch (error) {
        console.warn("[dashboard/subscribers] subscriber query skipped", error?.message || error);
        return null;
      }
    }),
  );

  const docsById = new Map();
  snapshots.forEach((snapshot) => {
    if (!snapshot) return;
    snapshot.docs.forEach((docSnap) => {
      docsById.set(docSnap.id, docSnap);
    });
  });
  return [...docsById.values()];
}

/**
 * Find Users doc by Firebase uid (doc id), owner_uid, or email.
 * @returns {{ ref, id, data, resolvedBy, steps } | { ambiguous: true, count?, matchType?, steps } | { notFound: true, steps }}
 */
async function resolveUserDocument(db, { uid, email }) {
  const steps = [];
  const u = typeof uid === "string" ? uid.trim() : "";
  const emRaw = typeof email === "string" ? email.trim() : "";

  if (u) {
    steps.push({ step: "Users.doc(uid)", uid: u });
    const byId = await db.collection("Users").doc(u).get();
    if (byId.exists) {
      return {
        ref: byId.ref,
        id: byId.id,
        data: byId.data() || {},
        resolvedBy: "doc_id",
        steps,
      };
    }
    steps.push({ step: "Users.where(owner_uid)", owner_uid: u, found: false });

    const qOwner = await db.collection("Users").where("owner_uid", "==", u).limit(5).get();
    if (!qOwner.empty) {
      steps.push({ step: "Users.where(owner_uid)", owner_uid: u, found: true, count: qOwner.size });
      if (qOwner.size > 1) {
        return {
          ambiguous: true,
          count: qOwner.size,
          matchType: "owner_uid",
          steps,
          docIds: qOwner.docs.map((d) => d.id),
        };
      }
      const doc = qOwner.docs[0];
      return {
        ref: doc.ref,
        id: doc.id,
        data: doc.data() || {},
        resolvedBy: "owner_uid",
        steps,
      };
    }
  }

  if (emRaw) {
    steps.push({ step: "Users.where(email)", email: emRaw });
    const qMail = await db.collection("Users").where("email", "==", emRaw).limit(10).get();
    if (qMail.empty) {
      const lower = emRaw.toLowerCase();
      if (lower !== emRaw) {
        steps.push({ step: "Users.where(email lowercase)", email: lower });
        const q2 = await db.collection("Users").where("email", "==", lower).limit(10).get();
        if (!q2.empty) {
          steps.push({ step: "Users.where(email lowercase)", email: lower, found: true, count: q2.size });
          if (q2.size > 1) {
            return {
              ambiguous: true,
              count: q2.size,
              matchType: "email_lower",
              steps,
              docIds: q2.docs.map((d) => d.id),
            };
          }
          const doc = q2.docs[0];
          return {
            ref: doc.ref,
            id: doc.id,
            data: doc.data() || {},
            resolvedBy: "email_lower",
            steps,
          };
        }
      }
      return { notFound: true, steps };
    }
    steps.push({ step: "Users.where(email)", email: emRaw, found: true, count: qMail.size });
    if (qMail.size > 1) {
      return {
        ambiguous: true,
        count: qMail.size,
        matchType: "email",
        steps,
        docIds: qMail.docs.map((d) => d.id),
      };
    }
    const doc = qMail.docs[0];
    return {
      ref: doc.ref,
      id: doc.id,
      data: doc.data() || {},
      resolvedBy: "email",
      steps,
    };
  }

  return { notFound: true, steps };
}

export default async function handler(req, res) {
  const token = req.headers["x-dashboard-token"] || "";
  if (token !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const db = getAdminDb();
      const docs = await loadSubscriberUserDocs(db);
      const subscribers = [];
      docs.forEach((docSnap) => {
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
        const input = {
          uid: typeof uidIn === "string" ? uidIn.trim() || null : null,
          email: typeof emailIn === "string" ? emailIn.trim() || null : null,
          months,
          note: typeof note === "string" ? note.trim() || null : null,
        };

        console.log("[grant_manual] start", input);

        if (!input.uid && !input.email) {
          const debug = { input, reason: "missing_uid_and_email" };
          console.warn("[grant_manual] rejected", debug);
          return res.status(400).json({ error: "Provide uid or email", debug });
        }

        const resolved = await resolveUserDocument(db, { uid: input.uid, email: input.email });
        if (resolved?.ambiguous) {
          const debug = {
            input,
            reason: "ambiguous_user",
            matchType: resolved.matchType,
            count: resolved.count,
            docIds: resolved.docIds,
            steps: resolved.steps,
          };
          console.warn("[grant_manual] ambiguous", debug);
          return res.status(400).json({
            error: "ambiguous_user",
            message: "Mai mulți utilizatori găsiți. Folosește UID-ul exact din Firebase Auth.",
            count: resolved.count,
            debug,
          });
        }
        if (resolved?.notFound) {
          const debug = { input, reason: "user_not_found", steps: resolved.steps };
          console.warn("[grant_manual] not found", debug);
          return res.status(404).json({ error: "User not found", debug });
        }

        const { ref, id, data, resolvedBy } = resolved;
        const before = userGrantSnapshot(data, id);
        const stripeSub = typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId.trim() : "";
        /** Nu acoperim peste acces încă activ; permitem dacă e expirat/fără acces dar a rămas vechiul sub id în Firestore. */
        const stillPaidStripeAccess =
          stripeSub &&
          hasPremiumAccess(data) &&
          data.subscriptionProvider !== "manual";
        if (stillPaidStripeAccess) {
          const debug = {
            input,
            reason: "stripe_subscription_active",
            resolvedBy,
            before,
            stripeSub,
          };
          console.warn("[grant_manual] blocked by stripe", debug);
          return res.status(409).json({
            error: "stripe_subscription_active",
            message:
              "Are încă acces premium (inclusiv prin Stripe). Folosește „Șterge” pe rând sau anulează în Stripe înainte de a acorda manual.",
            debug,
          });
        }

        let expiresField = FieldValue.delete();
        const m = typeof months === "number" ? months : parseInt(String(months ?? ""), 10);
        const unlimited = !(Number.isFinite(m) && m > 0);
        if (!unlimited) {
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

        const writePayload = {
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
        };

        console.log("[grant_manual] writing", {
          input,
          resolvedBy,
          targetDocId: id,
          unlimited,
          months: unlimited ? 0 : m,
          before,
        });

        await ref.set(writePayload, { merge: true });

        const afterSnap = await ref.get();
        const afterData = afterSnap.data() || {};
        const after = userGrantSnapshot(afterData, id);
        const mappedRow = mapDocToSubscriber(afterSnap);
        const listDocs = await loadSubscriberUserDocs(db);
        const inSubscriberList = listDocs.some((docSnap) => docSnap.id === id);

        const debug = {
          input,
          resolvedBy,
          targetDocId: id,
          before,
          after,
          unlimited,
          months: unlimited ? 0 : m,
          appearsInTable: mappedRow !== null,
          inSubscriberList,
          tableRow: mappedRow,
        };

        if (!debug.appearsInTable || !debug.inSubscriberList) {
          console.error("[grant_manual] write ok but missing from list", debug);
        } else {
          console.log("[grant_manual] success", debug);
        }

        return res.status(200).json({ ok: true, uid: id, granted: true, debug });
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
