#!/usr/bin/env node
/* eslint-disable no-console */

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const LIVE = process.argv.includes("--live");
const confirmationArg = process.argv.find((arg) => arg.startsWith("--confirm="));
const confirmation = confirmationArg ? confirmationArg.slice("--confirm=".length).trim() : "";
const ACTIVE = new Set(["active", "trialing", "past_due"]);
const EXPECTED_NET = 500;
const EXPECTED_TAX = 105;
const EXPECTED_TOTAL = 605;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function csvCell(value) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function priceIdOf(subscription) {
  return clean(subscription?.items?.data?.[0]?.price?.id);
}

function taxRateIds(subscription) {
  return (subscription?.default_tax_rates || []).map((rate) =>
    typeof rate === "string" ? rate : clean(rate?.id)
  );
}

function automaticTaxDisabled(subscription) {
  return subscription?.automatic_tax?.enabled !== true;
}

function initFirestoreIfConfigured() {
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin.firestore();
}

async function clearAddressGate(db, subscriptionId, customerId) {
  if (!db) return "firestore_not_configured";
  let snapshot = await db
    .collection("Users")
    .where("stripeSubscriptionId", "==", subscriptionId)
    .limit(2)
    .get();
  if (!snapshot.docs.length && customerId) {
    snapshot = await db
      .collection("Users")
      .where("stripeCustomerId", "==", customerId)
      .limit(2)
      .get();
  }
  if (snapshot.docs.length !== 1) {
    return snapshot.docs.length ? "multiple_users" : "user_not_found";
  }
  await snapshot.docs[0].ref.set(
    {
      premiumTaxAddressGate: {
        required: false,
        readyForMigration: false,
        migrationCompleted: true,
        clearedForFixedVatAt: admin.firestore.FieldValue.serverTimestamp(),
        version: 2,
      },
    },
    { merge: true }
  );
  return "cleared";
}

async function previewNextInvoice(stripe, subscription) {
  if (subscription.cancel_at_period_end) {
    return { ok: true, skipped: "cancel_at_period_end", subtotal: null, tax: null, total: null };
  }
  try {
    const invoice = await stripe.invoices.createPreview({
      customer:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id,
      subscription: subscription.id,
    });
    const taxRows = [
      ...(Array.isArray(invoice.total_tax_amounts) ? invoice.total_tax_amounts : []),
      ...(Array.isArray(invoice.total_taxes) ? invoice.total_taxes : []),
    ];
    const arrayTax = taxRows.reduce((sum, row) => sum + (Number(row?.amount) || 0), 0);
    const tax = Number.isFinite(Number(invoice.tax)) ? Number(invoice.tax) : arrayTax;
    const subtotal = Number(invoice.subtotal);
    const total = Number(invoice.total);
    return {
      ok: subtotal === EXPECTED_NET && tax === EXPECTED_TAX && total === EXPECTED_TOTAL,
      subtotal,
      tax,
      total,
      skipped: "",
    };
  } catch (error) {
    return {
      ok: false,
      skipped: "",
      error: clean(error?.message).slice(0, 300),
      subtotal: null,
      tax: null,
      total: null,
    };
  }
}

(async () => {
  if (!LIVE) throw new Error("This operational migration requires --live");
  const key = clean(process.env.STRIPE_SECRET_KEY_LIVE);
  if (!key.startsWith("sk_live_") && !key.startsWith("rk_live_")) {
    throw new Error("Missing live Stripe key");
  }
  if (APPLY) {
    if (process.env.PREMIUM_FIXED_VAT_MIGRATION_ENABLED !== "true") {
      throw new Error("Set PREMIUM_FIXED_VAT_MIGRATION_ENABLED=true for apply");
    }
    if (confirmation !== "MIGRATE_PREMIUM_FIXED_VAT_21") {
      throw new Error("Apply requires --confirm=MIGRATE_PREMIUM_FIXED_VAT_21");
    }
  }

  const exclusivePriceId = clean(process.env.STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE);
  const legacyPriceIds = [
    ...new Set(
      clean(process.env.STRIPE_PREMIUM_LEGACY_PRICE_IDS)
        .split(",")
        .map(clean)
        .filter(Boolean)
    ),
  ];
  const fixedTaxRateId = clean(process.env.STRIPE_FIXED_VAT_TAX_RATE_ID);
  if (!exclusivePriceId) throw new Error("Missing STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE");
  if (!legacyPriceIds.length) throw new Error("Missing STRIPE_PREMIUM_LEGACY_PRICE_IDS");
  if (!fixedTaxRateId.startsWith("txr_")) throw new Error("Missing STRIPE_FIXED_VAT_TAX_RATE_ID");

  const stripe = new Stripe(key);
  const db = initFirestoreIfConfigured();
  const [price, taxRate] = await Promise.all([
    stripe.prices.retrieve(exclusivePriceId),
    stripe.taxRates.retrieve(fixedTaxRateId),
  ]);
  if (
    price.active !== true ||
    price.currency !== "eur" ||
    price.unit_amount !== EXPECTED_NET ||
    price.tax_behavior !== "exclusive" ||
    price.recurring?.interval !== "month"
  ) {
    throw new Error("Exclusive Premium Price is not active EUR 5/month tax_behavior=exclusive");
  }
  if (
    taxRate.active !== true ||
    taxRate.inclusive !== false ||
    Number(taxRate.percentage) !== 21
  ) {
    throw new Error("Configured Tax Rate is not active, exclusive, 21%");
  }

  const byId = new Map();
  for (const priceId of [exclusivePriceId, ...legacyPriceIds]) {
    for await (const subscription of stripe.subscriptions.list({
      price: priceId,
      status: "all",
      limit: 100,
    })) {
      if (ACTIVE.has(subscription.status)) byId.set(subscription.id, subscription);
    }
  }

  const rows = [];
  const summary = {
    mode: APPLY ? "APPLY" : VERIFY ? "VERIFY" : "DRY_RUN",
    activeScanned: byId.size,
    alreadyCorrect: 0,
    needsMigration: 0,
    migrated: 0,
    cancelAtPeriodEnd: 0,
    taxExempt: 0,
    reverse: 0,
    verified605: 0,
    previewSkippedCancel: 0,
    failed: 0,
    gateCleared: 0,
    gateClearSkipped: 0,
  };

  for (const initial of byId.values()) {
    const item = initial.items?.data?.[0];
    const currentTaxRateIds = taxRateIds(initial);
    const currentCorrect =
      priceIdOf(initial) === exclusivePriceId &&
      automaticTaxDisabled(initial) &&
      currentTaxRateIds.length === 1 &&
      currentTaxRateIds[0] === fixedTaxRateId;
    if (initial.cancel_at_period_end) summary.cancelAtPeriodEnd += 1;
    if (currentCorrect) summary.alreadyCorrect += 1;
    else summary.needsMigration += 1;

    let customer = null;
    try {
      const customerId =
        typeof initial.customer === "string" ? initial.customer : initial.customer?.id;
      customer = customerId ? await stripe.customers.retrieve(customerId) : null;
    } catch (_) {}
    const taxExempt = !customer || customer.deleted ? "unknown" : clean(customer.tax_exempt) || "none";
    if (taxExempt === "exempt") summary.taxExempt += 1;
    if (taxExempt === "reverse") summary.reverse += 1;

    let finalSubscription = initial;
    let error = "";
    if (APPLY && !currentCorrect) {
      try {
        if (!item?.id) throw new Error("Missing subscription item");
        finalSubscription = await stripe.subscriptions.update(
          initial.id,
          {
            automatic_tax: { enabled: false },
            default_tax_rates: [fixedTaxRateId],
            billing_cycle_anchor: "unchanged",
            proration_behavior: "none",
            items: [{ id: item.id, price: exclusivePriceId, quantity: 1 }],
            metadata: {
              ...(initial.metadata || {}),
              flow: initial.metadata?.flow || "site_premium",
              taxMigration: "fixed_vat_21_v1",
              fixedVatTaxRateId: fixedTaxRateId,
            },
          },
          {
            idempotencyKey: `premium-fixed-vat-21-v1-${initial.id}-${fixedTaxRateId}`,
          }
        );
        summary.migrated += 1;
      } catch (updateError) {
        error = clean(updateError?.message).slice(0, 300);
        summary.failed += 1;
      }
    }

    const finalRateIds = taxRateIds(finalSubscription);
    const configOk =
      priceIdOf(finalSubscription) === exclusivePriceId &&
      automaticTaxDisabled(finalSubscription) &&
      finalRateIds.length === 1 &&
      finalRateIds[0] === fixedTaxRateId;

    let preview = { ok: false, skipped: APPLY || VERIFY ? "" : "dry_run", subtotal: null, tax: null, total: null };
    if ((APPLY || VERIFY) && configOk && !error) {
      if (APPLY) {
        const customerId =
          typeof finalSubscription.customer === "string"
            ? finalSubscription.customer
            : finalSubscription.customer?.id;
        try {
          const gateResult = await clearAddressGate(db, finalSubscription.id, customerId);
          if (gateResult === "cleared") summary.gateCleared += 1;
          else summary.gateClearSkipped += 1;
        } catch (gateError) {
          summary.gateClearSkipped += 1;
          if (!error) error = `gate_clear:${clean(gateError?.message).slice(0, 220)}`;
        }
      }
      preview = await previewNextInvoice(stripe, finalSubscription);
      if (preview.skipped === "cancel_at_period_end") summary.previewSkippedCancel += 1;
      else if (preview.ok) summary.verified605 += 1;
      else if (taxExempt === "none") summary.failed += 1;
    }

    rows.push({
      email: !customer || customer.deleted ? "" : clean(customer.email).toLowerCase(),
      customerId: !customer || customer.deleted ? "" : customer.id,
      subscriptionId: initial.id,
      status: initial.status,
      cancelAtPeriodEnd: initial.cancel_at_period_end === true,
      taxExempt,
      initialPriceId: priceIdOf(initial),
      finalPriceId: priceIdOf(finalSubscription),
      initialAutomaticTax: initial.automatic_tax?.enabled === true,
      finalAutomaticTax: finalSubscription.automatic_tax?.enabled === true,
      finalTaxRateIds: finalRateIds.join("|"),
      configOk,
      previewSubtotal: preview.subtotal,
      previewTax: preview.tax,
      previewTotal: preview.total,
      previewOk: preview.ok,
      previewSkipped: preview.skipped || "",
      error: error || preview.error || "",
    });
  }

  const outputPath = path.join(
    process.cwd(),
    "private-exports",
    `premium-fixed-vat-${APPLY ? "apply" : VERIFY ? "verify" : "dry-run"}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.csv`
  );
  const headers = Object.keys(rows[0] || { subscriptionId: "" });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.map(csvCell).join(",")}\n${rows
      .map((row) => headers.map((header) => csvCell(row[header])).join(","))
      .join("\n")}\n`,
    { encoding: "utf8", mode: 0o600 }
  );

  console.log(JSON.stringify({ event: "premium-fixed-vat.summary", summary, outputPath }, null, 2));
  if (summary.failed) process.exitCode = 1;
})().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
