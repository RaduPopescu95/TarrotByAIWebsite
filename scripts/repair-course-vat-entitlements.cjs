#!/usr/bin/env node
/* eslint-disable no-console */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const APPLY = process.argv.includes("--apply");
const LIVE = process.argv.includes("--live");
const CONFIRMATION = "REPAIR_COURSE_VAT_ENTITLEMENTS_2026_08_08";
const confirmationArg = process.argv.find((arg) => arg.startsWith("--confirm="));
const confirmation = confirmationArg ? confirmationArg.slice("--confirm=".length).trim() : "";
const REPAIR_SOURCE = "course_vat_repair_2026_08_08";
const EXPECTED_UID = "LQheTX2moAhKbu72gaStkZgaGz32";

// Process the standalone course first. The bundle then preserves that paid
// purchase as the canonical entitlement for the overlapping course.
const TARGETS = [
  {
    type: "course",
    sessionId: "cs_live_a1ifKfaIXbkDdxiyDB7BnErggyHqmyniNGf1RvYFTLwPRySXdtsLXMT6Fq",
    itemId: "syVhgFDYlCo9DBIsG5M4",
    subtotal: 500,
    tax: 105,
    total: 605,
    currency: "eur",
  },
  {
    type: "bundle",
    sessionId: "cs_live_a12ACVAbRE5tyKEUQgysc5nbdSUpXoiiTc1cQD5d2w1uMvgJ0TL62Pr4HP",
    itemId: "2eKHGindq2XFdfET7de4",
    subtotal: 2500,
    tax: 525,
    total: 3025,
    currency: "eur",
  },
];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function initFirestore() {
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials");
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin.firestore();
}

function sessionTaxCents(session) {
  return Number(session?.total_details?.amount_tax);
}

function validateSession(session, target) {
  const metadata = session?.metadata || {};
  const purchaseType = clean(metadata.purchaseType).toLowerCase() === "bundle" ? "bundle" : "course";
  const itemId = target.type === "bundle" ? clean(metadata.bundleId) : clean(metadata.courseId);
  const failures = [];
  if (session?.id !== target.sessionId) failures.push("session_id");
  if (session?.livemode !== true) failures.push("not_live");
  if (session?.mode !== "payment") failures.push("mode");
  if (session?.payment_status !== "paid") failures.push("not_paid");
  if (clean(metadata.uid) !== EXPECTED_UID) failures.push("uid");
  if (purchaseType !== target.type) failures.push("purchase_type");
  if (itemId !== target.itemId) failures.push("item_id");
  if (Number(session?.amount_subtotal) !== target.subtotal) failures.push("subtotal");
  if (Number(metadata.expectedAmount) !== target.subtotal) failures.push("metadata_expected_amount");
  if (Number(sessionTaxCents(session)) !== target.tax) failures.push("tax");
  if (Number(session?.amount_total) !== target.total) failures.push("total");
  if (clean(session?.currency).toLowerCase() !== target.currency) failures.push("currency");
  if (clean(metadata.expectedCurrency).toLowerCase() !== target.currency) {
    failures.push("metadata_expected_currency");
  }
  if (target.type === "bundle") {
    const courseIds = clean(metadata.courseIds)
      .split(",")
      .map(clean)
      .filter(Boolean);
    if (courseIds.length < 2) failures.push("bundle_course_ids");
  }
  if (failures.length) {
    throw new Error(`Session ${target.sessionId} failed validation: ${failures.join(",")}`);
  }
}

async function readCurrentState(db, session, target) {
  const paymentRef = db.collection("payments").doc(target.sessionId);
  const checkoutRef = db.collection("courseCheckoutSessions").doc(target.sessionId);
  const purchaseRef =
    target.type === "bundle"
      ? db.collection("users").doc(EXPECTED_UID).collection("bundlePurchases").doc(target.itemId)
      : db.collection("users").doc(EXPECTED_UID).collection("purchases").doc(target.itemId);
  const [paymentSnap, checkoutSnap, purchaseSnap] = await Promise.all([
    paymentRef.get(),
    checkoutRef.get(),
    purchaseRef.get(),
  ]);
  const payment = paymentSnap.exists ? paymentSnap.data() || {} : {};
  const checkout = checkoutSnap.exists ? checkoutSnap.data() || {} : {};
  const purchase = purchaseSnap.exists ? purchaseSnap.data() || {} : {};
  const eventId =
    clean(payment.lastWebhookEventId) ||
    clean(purchase.lastWebhookEventId) ||
    clean(checkout.lastWebhookEventId);
  return {
    eventId,
    before: {
      paymentStatus: clean(payment.paymentStatus),
      entitlementGranted: payment.entitlementGranted === true,
      amountMatches: payment.amountMatches === true,
      purchaseStatus: clean(purchase.status),
      checkoutStatus: clean(checkout.status),
    },
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
  };
}

function reconciliationPatch(timestamp) {
  return {
    entitlementGranted: true,
    amountMatches: true,
    reconciledAt: timestamp,
    reconciliationSource: REPAIR_SOURCE,
    updatedAt: timestamp,
  };
}

async function repairCourse(db, session, target, current) {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const userRef = db.collection("users").doc(EXPECTED_UID);
  const purchaseRef = userRef.collection("purchases").doc(target.itemId);
  const paymentRef = db.collection("payments").doc(target.sessionId);
  const checkoutRef = db.collection("courseCheckoutSessions").doc(target.sessionId);
  const courseRef = db.collection("courses").doc(target.itemId);
  const eventRef = current.eventId
    ? db.collection("stripeWebhookEvents").doc(current.eventId)
    : null;

  return db.runTransaction(async (transaction) => {
    const reads = [purchaseRef, courseRef, paymentRef, checkoutRef];
    if (eventRef) reads.push(eventRef);
    const [purchaseSnap, courseSnap] = await Promise.all(
      reads.map((ref) => transaction.get(ref))
    );
    if (!courseSnap.exists) throw new Error(`Course not found: ${target.itemId}`);
    const alreadyPaid = purchaseSnap.exists && purchaseSnap.data()?.status === "paid";
    if (!alreadyPaid) {
      transaction.set(
        purchaseRef,
        {
          courseId: target.itemId,
          stripeCheckoutSessionId: target.sessionId,
          stripePaymentIntentId: current.paymentIntentId || null,
          amountPaid: target.total / 100,
          amountPaidCents: target.total,
          currency: target.currency.toUpperCase(),
          paymentStatus: "paid",
          status: "paid",
          accessSource: "purchase",
          purchasedAt: timestamp,
          ...reconciliationPatch(timestamp),
        },
        { merge: true }
      );
      transaction.set(
        courseRef,
        {
          purchaseCount: admin.firestore.FieldValue.increment(1),
          updatedAt: timestamp,
        },
        { merge: true }
      );
    }
    transaction.set(
      paymentRef,
      {
        paymentStatus: "paid",
        amountPaid: target.total / 100,
        amountPaidCents: target.total,
        amountSubtotalCents: target.subtotal,
        expectedAmountCents: target.subtotal,
        currency: target.currency.toUpperCase(),
        expectedCurrency: target.currency.toUpperCase(),
        ...reconciliationPatch(timestamp),
      },
      { merge: true }
    );
    transaction.set(
      checkoutRef,
      {
        paymentStatus: "paid",
        status: "paid",
        ...reconciliationPatch(timestamp),
      },
      { merge: true }
    );
    if (eventRef) {
      transaction.set(
        eventRef,
        {
          entitlementGranted: true,
          reconciledAt: timestamp,
          reconciliationSource: REPAIR_SOURCE,
        },
        { merge: true }
      );
    }
    return { alreadyPaid };
  });
}

async function repairBundle(db, session, target, current) {
  const metadata = session.metadata || {};
  const courseIds = clean(metadata.courseIds)
    .split(",")
    .map(clean)
    .filter(Boolean);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const userRef = db.collection("users").doc(EXPECTED_UID);
  const bundlePurchaseRef = userRef.collection("bundlePurchases").doc(target.itemId);
  const purchaseRefs = courseIds.map((courseId) => userRef.collection("purchases").doc(courseId));
  const courseRefs = courseIds.map((courseId) => db.collection("courses").doc(courseId));
  const bundleRef = db.collection("courseBundles").doc(target.itemId);
  const paymentRef = db.collection("payments").doc(target.sessionId);
  const checkoutRef = db.collection("courseCheckoutSessions").doc(target.sessionId);
  const eventRef = current.eventId
    ? db.collection("stripeWebhookEvents").doc(current.eventId)
    : null;

  return db.runTransaction(async (transaction) => {
    const refs = [
      bundlePurchaseRef,
      bundleRef,
      ...purchaseRefs,
      ...courseRefs,
      paymentRef,
      checkoutRef,
      ...(eventRef ? [eventRef] : []),
    ];
    const snaps = await Promise.all(refs.map((ref) => transaction.get(ref)));
    const bundlePurchaseSnap = snaps[0];
    const bundleSnap = snaps[1];
    const purchaseSnaps = snaps.slice(2, 2 + purchaseRefs.length);
    const courseSnaps = snaps.slice(
      2 + purchaseRefs.length,
      2 + purchaseRefs.length + courseRefs.length
    );
    if (!bundleSnap.exists) throw new Error(`Bundle not found: ${target.itemId}`);
    const missingCourseIds = courseIds.filter((_, index) => !courseSnaps[index].exists);
    if (missingCourseIds.length) {
      throw new Error(`Bundle courses not found: ${missingCourseIds.join(",")}`);
    }

    const bundleAlreadyPaid =
      bundlePurchaseSnap.exists && bundlePurchaseSnap.data()?.status === "paid";
    if (!bundleAlreadyPaid) {
      transaction.set(
        bundlePurchaseRef,
        {
          bundleId: target.itemId,
          courseIds,
          stripeCheckoutSessionId: target.sessionId,
          stripePaymentIntentId: current.paymentIntentId || null,
          amountPaid: target.total / 100,
          amountPaidCents: target.total,
          currency: target.currency.toUpperCase(),
          paymentStatus: "paid",
          status: "paid",
          purchasedAt: timestamp,
          ...reconciliationPatch(timestamp),
        },
        { merge: true }
      );
    }

    let newlyGrantedCourses = 0;
    purchaseRefs.forEach((purchaseRef, index) => {
      const alreadyPaid =
        purchaseSnaps[index].exists && purchaseSnaps[index].data()?.status === "paid";
      if (alreadyPaid) return;
      newlyGrantedCourses += 1;
      transaction.set(
        purchaseRef,
        {
          courseId: courseIds[index],
          stripeCheckoutSessionId: target.sessionId,
          stripePaymentIntentId: current.paymentIntentId || null,
          amountPaid: 0,
          amountPaidCents: 0,
          currency: target.currency.toUpperCase(),
          paymentStatus: "paid",
          status: "paid",
          accessSource: "bundle",
          bundleId: target.itemId,
          purchasedAt: timestamp,
          ...reconciliationPatch(timestamp),
        },
        { merge: true }
      );
      transaction.set(
        courseRefs[index],
        {
          purchaseCount: admin.firestore.FieldValue.increment(1),
          updatedAt: timestamp,
        },
        { merge: true }
      );
    });

    if (!bundleAlreadyPaid) {
      transaction.set(
        bundleRef,
        {
          purchaseCount: admin.firestore.FieldValue.increment(1),
          updatedAt: timestamp,
        },
        { merge: true }
      );
    }
    transaction.set(
      paymentRef,
      {
        paymentStatus: "paid",
        amountPaid: target.total / 100,
        amountPaidCents: target.total,
        amountSubtotalCents: target.subtotal,
        expectedAmountCents: target.subtotal,
        currency: target.currency.toUpperCase(),
        expectedCurrency: target.currency.toUpperCase(),
        ...reconciliationPatch(timestamp),
      },
      { merge: true }
    );
    transaction.set(
      checkoutRef,
      {
        paymentStatus: "paid",
        status: "paid",
        ...reconciliationPatch(timestamp),
      },
      { merge: true }
    );
    if (eventRef) {
      transaction.set(
        eventRef,
        {
          entitlementGranted: true,
          reconciledAt: timestamp,
          reconciliationSource: REPAIR_SOURCE,
        },
        { merge: true }
      );
    }
    return { bundleAlreadyPaid, newlyGrantedCourses };
  });
}

(async () => {
  if (!LIVE) throw new Error("This repair requires --live");
  if (APPLY && confirmation !== CONFIRMATION) {
    throw new Error(`Apply requires --confirm=${CONFIRMATION}`);
  }
  const key = clean(process.env.STRIPE_SECRET_KEY_LIVE);
  if (!key.startsWith("sk_live_") && !key.startsWith("rk_live_")) {
    throw new Error("Missing live Stripe key");
  }

  const stripe = new Stripe(key);
  const db = initFirestore();
  const report = [];
  for (const target of TARGETS) {
    const session = await stripe.checkout.sessions.retrieve(target.sessionId);
    validateSession(session, target);
    const current = await readCurrentState(db, session, target);
    let outcome = { dryRun: true };
    if (APPLY) {
      outcome =
        target.type === "bundle"
          ? await repairBundle(db, session, target, current)
          : await repairCourse(db, session, target, current);
    }
    report.push({
      type: target.type,
      sessionId: target.sessionId,
      itemId: target.itemId,
      subtotal: target.subtotal,
      tax: target.tax,
      total: target.total,
      before: current.before,
      outcome,
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        source: REPAIR_SOURCE,
        refundCreated: false,
        report,
      },
      null,
      2
    )
  );
})().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
