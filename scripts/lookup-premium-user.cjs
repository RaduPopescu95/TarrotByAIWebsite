#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Read-only lookup of one premium user across Firebase Auth, Firestore and Stripe.
 * Usage: node scripts/lookup-premium-user.cjs --live --email=someone@example.com
 */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const LIVE = process.argv.includes("--live");
const emailArg = process.argv.find((a) => a.startsWith("--email="));
const email = (emailArg ? emailArg.slice("--email=".length) : "").trim().toLowerCase();

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function iso(value) {
  if (value == null) return null;
  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value;
  }
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value.toMillis === "function") return new Date(value.toMillis()).toISOString();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  return String(value);
}

function pick(obj, keys) {
  const out = {};
  for (const key of keys) out[key] = obj?.[key] === undefined ? null : obj[key];
  return out;
}

async function main() {
  if (!email) throw new Error("Missing --email=");
  const secretKey = LIVE
    ? clean(process.env.STRIPE_SECRET_KEY_LIVE)
    : clean(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) throw new Error("Missing Stripe secret key");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: clean(process.env.FIREBASE_PROJECT_ID),
        clientEmail: clean(process.env.FIREBASE_CLIENT_EMAIL),
        privateKey: clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n"),
      }),
    });
  }
  const db = admin.firestore();
  const stripe = new Stripe(secretKey);
  console.log(`Mode: ${secretKey.startsWith("sk_live") ? "LIVE" : "TEST"}`);
  console.log(`Email: ${email}\n`);

  console.log("########## FIREBASE AUTH ##########");
  let authUser = null;
  try {
    authUser = await admin.auth().getUserByEmail(email);
    console.log({
      uid: authUser.uid,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      disabled: authUser.disabled,
      providers: (authUser.providerData || []).map((p) => p.providerId),
      createdAt: authUser.metadata?.creationTime || null,
      lastSignIn: authUser.metadata?.lastSignInTime || null,
    });
  } catch (err) {
    console.log("Auth user not found:", err?.message);
  }

  console.log("\n########## FIRESTORE Users ##########");
  const users = [];
  if (authUser) {
    const snap = await db.collection("Users").doc(authUser.uid).get();
    if (snap.exists) users.push({ id: snap.id, data: snap.data() || {} });
  }
  const byEmail = await db.collection("Users").where("email", "==", email).limit(5).get();
  for (const doc of byEmail.docs) {
    if (!users.some((u) => u.id === doc.id)) users.push({ id: doc.id, data: doc.data() || {} });
  }
  if (!users.length) {
    console.log("No Users document found for this email.");
  }
  for (const user of users) {
    const d = user.data;
    console.log({
      uid: user.id,
      email: d.email || null,
      premium: d.premium ?? null,
      subscriptionStatus: d.subscriptionStatus ?? null,
      subscriptionProvider: d.subscriptionProvider ?? null,
      stripeCustomerId: d.stripeCustomerId ?? null,
      stripeSubscriptionId: d.stripeSubscriptionId ?? null,
      currentPeriodEnd: iso(d.currentPeriodEnd),
      premiumSubscriptionCancelAtPeriodEnd: d.premiumSubscriptionCancelAtPeriodEnd ?? null,
      premiumSources: d.premiumSources ?? null,
      activePremiumProviders: d.activePremiumProviders ?? null,
      revenueCatSubscriptionStatus: d.revenueCatSubscriptionStatus ?? null,
      revenueCatCurrentPeriodEnd: iso(d.revenueCatCurrentPeriodEnd),
      premiumPriceChangeConsent: d.premiumPriceChangeConsent
        ? {
            ...d.premiumPriceChangeConsent,
            acceptedAt: iso(d.premiumPriceChangeConsent.acceptedAt),
          }
        : null,
      premiumTaxAddressGate: d.premiumTaxAddressGate ?? null,
      lastSignIn: iso(d.lastSignIn) || iso(d.updatedAt),
    });
  }

  console.log("\n########## STRIPE CUSTOMERS ##########");
  const customers = await stripe.customers.list({ email, limit: 10 });
  console.log(`Customers with this email: ${customers.data.length}`);
  for (const customer of customers.data) {
    console.log({
      id: customer.id,
      email: customer.email,
      created: iso(customer.created),
      deleted: customer.deleted === true,
      metadata: customer.metadata || {},
    });
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 20,
    });
    console.log(`Subscriptions for ${customer.id}: ${subs.data.length}`);
    for (const sub of subs.data) {
      const invoice =
        typeof sub.latest_invoice === "string"
          ? await stripe.invoices.retrieve(sub.latest_invoice).catch(() => null)
          : null;
      console.log({
        id: sub.id,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        cancelAt: iso(sub.cancel_at),
        currentPeriodEnd: iso(sub.current_period_end),
        created: iso(sub.created),
        priceId: sub.items?.data?.[0]?.price?.id || null,
        unitAmount: sub.items?.data?.[0]?.price?.unit_amount ?? null,
        taxBehavior: sub.items?.data?.[0]?.price?.tax_behavior || null,
        defaultTaxRates: (sub.default_tax_rates || []).map((r) => ({
          id: typeof r === "string" ? r : r.id,
          percentage: typeof r === "string" ? null : r.percentage,
          inclusive: typeof r === "string" ? null : r.inclusive,
        })),
        metadata: sub.metadata || {},
        latestInvoice: invoice
          ? {
              id: invoice.id,
              status: invoice.status,
              total: invoice.total,
              tax: invoice.tax,
              subtotal: invoice.subtotal,
              created: iso(invoice.created),
            }
          : sub.latest_invoice || null,
      });
    }
  }
}

main().catch((err) => {
  console.error("LOOKUP FAILED:", err?.message || err);
  process.exit(1);
});
