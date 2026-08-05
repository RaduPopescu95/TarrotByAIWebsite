#!/usr/bin/env node
/* eslint-disable no-console */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const APPLY_CONFIRMATION = "MIGRATE_PREMIUM_TAX";
const ADDRESS_REPAIR_CONFIRMATION = "REPAIR_STRIPE_ADDRESSES";
const ADDRESS_GATE_CONFIRMATION = "MARK_PREMIUM_TAX_ADDRESS_REQUIRED";
const ALLOWED_STATUSES = new Set(["active", "trialing", "past_due"]);

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCsv(value) {
  return [...new Set(clean(value).split(",").map(clean).filter(Boolean))];
}

function getArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? clean(match.slice(prefix.length)) : "";
}

function maskStripeId(value) {
  const normalized = clean(value);
  if (normalized.length <= 12) return normalized || "unknown";
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}

function customerIdFromSubscription(subscription) {
  return typeof subscription?.customer === "string"
    ? subscription.customer
    : clean(subscription?.customer?.id);
}

function periodEndFromSubscription(subscription) {
  const subscriptionEnd = Number(subscription?.current_period_end);
  if (Number.isFinite(subscriptionEnd) && subscriptionEnd > 0) return subscriptionEnd;
  const itemEnds = (subscription?.items?.data || [])
    .map((item) => Number(item?.current_period_end))
    .filter((value) => Number.isFinite(value) && value > 0);
  return itemEnds.length ? Math.max(...itemEnds) : null;
}

function hasUsableTaxAddress(customer) {
  const address = customer?.address || customer?.shipping?.address || {};
  const country = clean(address.country).toUpperCase();
  const postalCode = clean(address.postal_code);
  if (!country || !postalCode) return false;
  if (country === "RO") {
    return Boolean(clean(address.line1) && clean(address.city));
  }
  return true;
}

function hasUsableInvoiceIdentity(customer) {
  const address = customer?.address || customer?.shipping?.address || {};
  const country = clean(address.country).toUpperCase();
  return Boolean(
    clean(customer?.name) &&
      clean(customer?.email) &&
      hasUsableTaxAddress(customer) &&
      (country !== "RO" || clean(address.state))
  );
}

function normalizeCountryCode(value) {
  const normalized = clean(value);
  const upper = normalized.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const simplified = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const known = {
    romania: "RO",
    germany: "DE",
    germania: "DE",
    france: "FR",
    franta: "FR",
    italy: "IT",
    italia: "IT",
    spain: "ES",
    spania: "ES",
    "united kingdom": "GB",
    "marea britanie": "GB",
    "united states": "US",
    sua: "US",
  };
  return known[simplified] || "";
}

function pickProfileValue(profile, paths) {
  for (const pathParts of paths) {
    let current = profile;
    for (const part of pathParts) current = current && typeof current === "object" ? current[part] : undefined;
    const value = clean(current);
    if (value) return value;
  }
  return "";
}

function buildStripeAddressFromPremiumProfile(profile) {
  if (!profile || typeof profile !== "object") return { ok: false, reason: "missing_premium_billing_profile" };
  const line1 = pickProfileValue(profile, [
    ["billing", "address", "line1"],
    ["billing", "company", "address"],
    ["normalizedBeforeCheckout", "address"],
    ["rawFormValues", "address"],
    ["rawFormValues", "billingAddress"],
  ]);
  const line2 = pickProfileValue(profile, [["billing", "address", "line2"]]);
  const city = pickProfileValue(profile, [
    ["billing", "address", "city"],
    ["normalizedBeforeCheckout", "city"],
    ["rawFormValues", "city"],
    ["rawFormValues", "billingCity"],
  ]);
  const state = pickProfileValue(profile, [
    ["billing", "address", "state"],
    ["billing", "address", "county"],
    ["normalizedBeforeCheckout", "state"],
    ["rawFormValues", "state"],
    ["rawFormValues", "county"],
    ["rawFormValues", "billingCounty"],
  ]);
  const postalCode = pickProfileValue(profile, [
    ["billing", "address", "postalCode"],
    ["billing", "address", "postal_code"],
    ["normalizedBeforeCheckout", "postalCode"],
    ["rawFormValues", "postalCode"],
    ["rawFormValues", "postal_code"],
  ]).replace(/\s+/g, "");
  const country = normalizeCountryCode(
    pickProfileValue(profile, [
      ["billing", "address", "country"],
      ["normalizedBeforeCheckout", "country"],
      ["rawFormValues", "country"],
      ["rawFormValues", "billingCountry"],
    ])
  );
  const reasons = [];
  if (!line1) reasons.push("firestore_address_missing_line1");
  if (!city) reasons.push("firestore_address_missing_city");
  if (!country) reasons.push("firestore_address_missing_or_unknown_country");
  if (!postalCode || postalCode === "000000") reasons.push("firestore_address_missing_postal_code");
  if (country === "RO" && !state) reasons.push("firestore_address_missing_romanian_county");
  if (country === "RO" && !/^\d{6}$/.test(postalCode)) reasons.push("firestore_address_invalid_romanian_postal_code");
  if (country !== "RO" && postalCode && postalCode.length < 3) reasons.push("firestore_address_invalid_postal_code");
  if (reasons.length) return { ok: false, reasons };
  return {
    ok: true,
    address: {
      line1,
      ...(line2 ? { line2 } : {}),
      city,
      ...(state ? { state } : {}),
      postal_code: postalCode,
      country,
    },
  };
}

function validateStripeAddressCandidate(rawAddress) {
  const source = rawAddress && typeof rawAddress === "object" ? rawAddress : {};
  const line1 = clean(source.line1 || source.address_line1);
  const line2 = clean(source.line2 || source.address_line2);
  const city = clean(source.city || source.address_city);
  const state = clean(source.state || source.address_state);
  const postalCode = clean(source.postal_code || source.postalCode || source.address_zip).replace(/\s+/g, "");
  const country = normalizeCountryCode(source.country || source.address_country);
  const reasons = [];
  if (!line1) reasons.push("payment_address_missing_line1");
  if (!city) reasons.push("payment_address_missing_city");
  if (!country) reasons.push("payment_address_missing_or_unknown_country");
  if (!postalCode || postalCode === "000000") reasons.push("payment_address_missing_postal_code");
  if (country === "RO" && !state) reasons.push("payment_address_missing_romanian_county");
  if (country === "RO" && !/^\d{6}$/.test(postalCode)) reasons.push("payment_address_invalid_romanian_postal_code");
  if (country !== "RO" && postalCode && postalCode.length < 3) reasons.push("payment_address_invalid_postal_code");
  if (reasons.length) return { ok: false, reasons };
  return {
    ok: true,
    address: {
      line1,
      ...(line2 ? { line2 } : {}),
      city,
      ...(state ? { state } : {}),
      postal_code: postalCode,
      country,
    },
  };
}

function paymentAddressFromObject(paymentObject) {
  if (!paymentObject || typeof paymentObject !== "object") return null;
  if (paymentObject.billing_details?.address) return paymentObject.billing_details.address;
  if (paymentObject.object === "card") {
    return {
      line1: paymentObject.address_line1,
      line2: paymentObject.address_line2,
      city: paymentObject.address_city,
      state: paymentObject.address_state,
      postal_code: paymentObject.address_zip,
      country: paymentObject.address_country,
    };
  }
  if (paymentObject.owner?.address) return paymentObject.owner.address;
  return null;
}

async function findCompleteStripePaymentAddress(stripe, subscription, customer) {
  const customerId = customerIdFromSubscription(subscription);
  const seen = new Set();
  const paymentObjects = [];
  const addPaymentObject = (value) => {
    if (!value || typeof value !== "object") return;
    const id = clean(value.id);
    if (id && seen.has(id)) return;
    if (id) seen.add(id);
    paymentObjects.push(value);
  };

  for (const candidate of [subscription?.default_payment_method, customer?.invoice_settings?.default_payment_method]) {
    if (candidate && typeof candidate === "object") {
      addPaymentObject(candidate);
    } else if (clean(candidate)) {
      try {
        addPaymentObject(await stripe.paymentMethods.retrieve(clean(candidate)));
      } catch (_) {
        // Continue with the Customer's attached payment methods.
      }
    }
  }

  if (customerId) {
    const attachedCards = stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 100 });
    for await (const paymentMethod of attachedCards) addPaymentObject(paymentMethod);

    const defaultSourceId =
      typeof customer?.default_source === "string" ? customer.default_source : clean(customer?.default_source?.id);
    if (customer?.default_source && typeof customer.default_source === "object") {
      addPaymentObject(customer.default_source);
    } else if (defaultSourceId) {
      try {
        addPaymentObject(await stripe.customers.retrieveSource(customerId, defaultSourceId));
      } catch (_) {
        // Legacy source may no longer be retrievable; attached PaymentMethods were already checked.
      }
    }
  }

  const reasonCounts = {};
  for (const paymentObject of paymentObjects) {
    const candidate = validateStripeAddressCandidate(paymentAddressFromObject(paymentObject));
    if (candidate.ok) return candidate;
    for (const reason of candidate.reasons || []) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }
  return {
    ok: false,
    reasons: paymentObjects.length
      ? Object.keys(reasonCounts)
      : ["stripe_payment_method_not_found"],
  };
}

function sumAmounts(values) {
  return (Array.isArray(values) ? values : []).reduce(
    (total, item) => total + (Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0),
    0
  );
}

function addReasonCounts(summary, reasons) {
  for (const reason of reasons) {
    summary.reasonCounts[reason] = (summary.reasonCounts[reason] || 0) + 1;
  }
}

function assessPreview(preview, customerCountry, destinationPrice) {
  const expectedNet = Number(destinationPrice?.unit_amount);
  const subtotal = Number(preview?.subtotal);
  const total = Number(preview?.total);
  const amountDue = Number(preview?.amount_due);
  const tax = sumAmounts(preview?.total_tax_amounts);
  const discounts = sumAmounts(preview?.total_discount_amounts);
  const taxStatus = clean(preview?.automatic_tax?.status);
  const country = clean(customerCountry).toUpperCase();
  const reasons = [];

  if (taxStatus !== "complete") reasons.push(`automatic_tax_${taxStatus || "unknown"}`);
  if (subtotal !== expectedNet) reasons.push("subtotal_not_destination_price");
  if (discounts !== 0) reasons.push("discount_present");
  if (amountDue !== total) reasons.push("customer_balance_or_credit_present");
  if (total !== subtotal + tax) reasons.push("preview_total_breakdown_mismatch");
  if (country === "RO" && !(subtotal === 500 && tax === 105 && total === 605)) {
    reasons.push("romanian_total_must_be_605");
  }

  return {
    ok: reasons.length === 0,
    reasons,
    subtotal,
    tax,
    total,
    amountDue,
    taxStatus,
    currency: clean(preview?.currency).toUpperCase(),
  };
}

function validateDestinationPrice(price) {
  const reasons = [];
  if (!price?.active) reasons.push("destination_price_inactive");
  if (price?.tax_behavior !== "exclusive") reasons.push("destination_price_not_exclusive");
  if (clean(price?.currency).toLowerCase() !== "eur") reasons.push("destination_price_not_eur");
  if (Number(price?.unit_amount) !== 500) reasons.push("destination_price_not_500_cents");
  if (price?.recurring?.interval !== "month" || Number(price?.recurring?.interval_count || 1) !== 1) {
    reasons.push("destination_price_not_monthly");
  }
  return { ok: reasons.length === 0, reasons };
}

function subscriptionStructuralBlockers(subscription, legacyPriceIds) {
  const items = subscription?.items?.data || [];
  const legacyItems = items.filter((item) => legacyPriceIds.includes(clean(item?.price?.id)));
  const reasons = [];
  if (!ALLOWED_STATUSES.has(subscription?.status)) reasons.push(`status_${subscription?.status || "unknown"}`);
  if (subscription?.cancel_at_period_end) reasons.push("cancel_at_period_end");
  if (subscription?.pause_collection) reasons.push("pause_collection");
  if (subscription?.pending_update) reasons.push("pending_update");
  if (subscription?.schedule) reasons.push("subscription_schedule_present");
  if (subscription?.collection_method !== "charge_automatically") reasons.push("not_charge_automatically");
  if (items.length !== 1 || legacyItems.length !== 1) reasons.push("subscription_items_not_single_legacy_item");
  if (legacyItems[0] && Number(legacyItems[0].quantity || 1) !== 1) reasons.push("quantity_not_one");
  if ((subscription?.default_tax_rates || []).length) reasons.push("manual_default_tax_rates_present");
  if ((legacyItems[0]?.tax_rates || []).length) reasons.push("manual_item_tax_rates_present");
  return { ok: reasons.length === 0, reasons, item: legacyItems[0] || null };
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

async function findPremiumUser(db, subscription, customerId) {
  if (!db) return { ok: false, reason: "firestore_not_configured" };

  const bySubscription = await db
    .collection("Users")
    .where("stripeSubscriptionId", "==", subscription.id)
    .limit(2)
    .get();
  let docs = bySubscription.docs;
  if (!docs.length && customerId) {
    const byCustomer = await db
      .collection("Users")
      .where("stripeCustomerId", "==", customerId)
      .limit(2)
      .get();
    docs = byCustomer.docs;
  }
  if (docs.length !== 1) {
    return { ok: false, reason: docs.length ? "multiple_firestore_users" : "firestore_user_not_found" };
  }
  const data = docs[0].data() || {};
  const hasBillingProfile = Boolean(
    data?.premiumBillingProfile?.billing && typeof data.premiumBillingProfile.billing === "object"
  );
  return {
    ok: true,
    uid: docs[0].id,
    hasBillingProfile,
    billingProfile: data?.premiumBillingProfile || null,
  };
}

async function listCandidates(stripe, legacyPriceIds, onlySubscriptionId) {
  if (onlySubscriptionId) {
    return [await stripe.subscriptions.retrieve(onlySubscriptionId, { expand: ["customer"] })];
  }
  const byId = new Map();
  for (const priceId of legacyPriceIds) {
    const subscriptions = stripe.subscriptions.list({ price: priceId, status: "all", limit: 100 });
    for await (const subscription of subscriptions) {
      byId.set(subscription.id, subscription);
    }
  }
  return [...byId.values()];
}

async function discoverPremiumPrices(stripe) {
  const rows = [];
  const prices = stripe.prices.list({
    active: true,
    type: "recurring",
    limit: 100,
    expand: ["data.product"],
  });
  for await (const price of prices) {
    if (
      clean(price.currency).toLowerCase() !== "eur" ||
      Number(price.unit_amount) !== 500 ||
      price?.recurring?.interval !== "month" ||
      Number(price?.recurring?.interval_count || 1) !== 1
    ) {
      continue;
    }
    const statuses = {};
    let subscriptions = 0;
    const matching = stripe.subscriptions.list({ price: price.id, status: "all", limit: 100 });
    for await (const subscription of matching) {
      statuses[subscription.status] = (statuses[subscription.status] || 0) + 1;
      subscriptions += 1;
    }
    rows.push({
      priceId: price.id,
      taxBehavior: clean(price.tax_behavior) || "unspecified",
      productName:
        price.product && typeof price.product === "object"
          ? clean(price.product.name).slice(0, 120)
          : "",
      subscriptions,
      statuses,
      likelyRole:
        price.tax_behavior === "exclusive"
          ? "destination_new"
          : subscriptions > 0
            ? "legacy_candidate"
            : "other",
    });
  }
  return rows;
}

async function resolveCustomer(stripe, subscription) {
  if (subscription?.customer && typeof subscription.customer === "object") return subscription.customer;
  const customerId = customerIdFromSubscription(subscription);
  return customerId ? stripe.customers.retrieve(customerId) : null;
}

function customerCountry(customer) {
  return clean(customer?.address?.country || customer?.shipping?.address?.country).toUpperCase();
}

async function previewMigration(stripe, subscription, item, destinationPriceId) {
  return stripe.invoices.createPreview({
    customer: customerIdFromSubscription(subscription),
    subscription: subscription.id,
    automatic_tax: { enabled: true },
    subscription_details: {
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
      items: [
        {
          id: item.id,
          price: destinationPriceId,
          quantity: 1,
        },
      ],
    },
  });
}

async function migrateOne(stripe, subscription, item, destinationPriceId, uid) {
  return stripe.subscriptions.update(
    subscription.id,
    {
      automatic_tax: { enabled: true },
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
      items: [{ id: item.id, price: destinationPriceId, quantity: 1 }],
      metadata: {
        ...(subscription.metadata || {}),
        flow: "site_premium",
        uid,
        taxMigration: "exclusive_v1",
      },
    },
    { idempotencyKey: `premium-tax-exclusive-v1-${subscription.id}-${destinationPriceId}` }
  );
}

async function runAddressRepair({ stripe, db, candidates, legacyPriceIds, apply, summaryOnly }) {
  if (!db) throw new Error("Address repair requires Firebase Admin configuration");
  const summary = {
    scanned: candidates.length,
    renewingCandidates: 0,
    alreadyCompleteInStripe: 0,
    repairableFromFirestore: 0,
    unrepairableFromFirestore: 0,
    repaired: 0,
    failed: 0,
    ignoredNonRenewing: 0,
    reasonCounts: {},
  };

  console.log("[premium-address-repair] start", { mode: apply ? "APPLY" : "DRY_RUN" });
  for (const subscription of candidates) {
    const structural = subscriptionStructuralBlockers(subscription, legacyPriceIds);
    if (!structural.ok) {
      summary.ignoredNonRenewing += 1;
      addReasonCounts(summary, structural.reasons);
      continue;
    }
    summary.renewingCandidates += 1;
    const customerId = customerIdFromSubscription(subscription);
    try {
      const customer = await resolveCustomer(stripe, subscription);
      if (!customer || customer.deleted) {
        summary.unrepairableFromFirestore += 1;
        addReasonCounts(summary, ["customer_missing_or_deleted"]);
        continue;
      }
      if (hasUsableTaxAddress(customer)) {
        summary.alreadyCompleteInStripe += 1;
        continue;
      }
      const user = await findPremiumUser(db, subscription, customerId);
      if (!user.ok) {
        summary.unrepairableFromFirestore += 1;
        addReasonCounts(summary, [user.reason]);
        continue;
      }
      const repair = buildStripeAddressFromPremiumProfile(user.billingProfile);
      if (!repair.ok) {
        summary.unrepairableFromFirestore += 1;
        addReasonCounts(summary, repair.reasons || [repair.reason || "firestore_address_incomplete"]);
        continue;
      }
      summary.repairableFromFirestore += 1;
      if (!apply) continue;

      const updated = await stripe.customers.update(
        customerId,
        { address: repair.address },
        { idempotencyKey: `premium-address-repair-v1-${customerId}` }
      );
      if (!hasUsableTaxAddress(updated)) throw new Error("post_update_customer_address_validation_failed");
      summary.repaired += 1;
      if (!summaryOnly) {
        console.log("[premium-address-repair] repaired", { customerId: maskStripeId(customerId) });
      }
    } catch (error) {
      summary.failed += 1;
      console.error("[premium-address-repair] failed", {
        customerId: maskStripeId(customerId),
        message: clean(error?.message).slice(0, 300),
      });
    }
  }
  console.log(
    JSON.stringify({ event: "premium-address-repair.summary", mode: apply ? "APPLY" : "DRY_RUN", summary }, null, 2)
  );
  if (summary.failed) process.exitCode = 1;
}

async function runPaymentAddressRepair({ stripe, candidates, legacyPriceIds, apply, summaryOnly }) {
  const summary = {
    scanned: candidates.length,
    renewingCandidates: 0,
    alreadyCompleteInStripe: 0,
    repairableFromStripePayments: 0,
    unrepairableFromStripePayments: 0,
    repaired: 0,
    failed: 0,
    ignoredNonRenewing: 0,
    reasonCounts: {},
  };

  console.log("[premium-payment-address-repair] start", { mode: apply ? "APPLY" : "DRY_RUN" });
  for (const subscription of candidates) {
    const structural = subscriptionStructuralBlockers(subscription, legacyPriceIds);
    if (!structural.ok) {
      summary.ignoredNonRenewing += 1;
      addReasonCounts(summary, structural.reasons);
      continue;
    }
    summary.renewingCandidates += 1;
    const customerId = customerIdFromSubscription(subscription);
    try {
      const customer = await resolveCustomer(stripe, subscription);
      if (!customer || customer.deleted) {
        summary.unrepairableFromStripePayments += 1;
        addReasonCounts(summary, ["customer_missing_or_deleted"]);
        continue;
      }
      if (hasUsableTaxAddress(customer)) {
        summary.alreadyCompleteInStripe += 1;
        continue;
      }
      const repair = await findCompleteStripePaymentAddress(stripe, subscription, customer);
      if (!repair.ok) {
        summary.unrepairableFromStripePayments += 1;
        addReasonCounts(summary, repair.reasons || ["stripe_payment_address_incomplete"]);
        continue;
      }
      summary.repairableFromStripePayments += 1;
      if (!apply) continue;

      const updated = await stripe.customers.update(
        customerId,
        { address: repair.address },
        { idempotencyKey: `premium-payment-address-repair-v1-${customerId}` }
      );
      if (!hasUsableTaxAddress(updated)) throw new Error("post_update_customer_address_validation_failed");
      summary.repaired += 1;
      if (!summaryOnly) {
        console.log("[premium-payment-address-repair] repaired", { customerId: maskStripeId(customerId) });
      }
    } catch (error) {
      summary.failed += 1;
      console.error("[premium-payment-address-repair] failed", {
        customerId: maskStripeId(customerId),
        message: clean(error?.message).slice(0, 300),
      });
    }
  }
  console.log(
    JSON.stringify(
      { event: "premium-payment-address-repair.summary", mode: apply ? "APPLY" : "DRY_RUN", summary },
      null,
      2
    )
  );
  if (summary.failed) process.exitCode = 1;
}

async function runAddressGateMarking({ stripe, db, candidates, legacyPriceIds, apply, summaryOnly }) {
  if (!db) throw new Error("Address gate marking requires Firebase Admin configuration");
  const summary = {
    scanned: candidates.length,
    renewingCandidates: 0,
    addressAlreadyComplete: 0,
    eligibleForGate: 0,
    marked: 0,
    failed: 0,
    ignoredNonRenewing: 0,
    reasonCounts: {},
  };

  console.log("[premium-tax-address-gate] start", { mode: apply ? "APPLY" : "DRY_RUN" });
  for (const subscription of candidates) {
    const structural = subscriptionStructuralBlockers(subscription, legacyPriceIds);
    if (!structural.ok) {
      summary.ignoredNonRenewing += 1;
      addReasonCounts(summary, structural.reasons);
      continue;
    }
    summary.renewingCandidates += 1;
    const customerId = customerIdFromSubscription(subscription);
    try {
      const customer = await resolveCustomer(stripe, subscription);
      if (!customer || customer.deleted) {
        addReasonCounts(summary, ["customer_missing_or_deleted"]);
        continue;
      }
      if (hasUsableTaxAddress(customer)) {
        summary.addressAlreadyComplete += 1;
        continue;
      }
      const user = await findPremiumUser(db, subscription, customerId);
      if (!user.ok) {
        addReasonCounts(summary, [user.reason]);
        continue;
      }

      summary.eligibleForGate += 1;
      if (!apply) continue;
      await db.collection("Users").doc(user.uid).set(
        {
          premiumTaxAddressGate: {
            required: true,
            readyForMigration: false,
            reason: "stripe_tax_address_incomplete",
            subscriptionId: subscription.id,
            renewalAt: periodEndFromSubscription(subscription)
              ? new Date(periodEndFromSubscription(subscription) * 1000).toISOString()
              : null,
            markedAt: admin.firestore.FieldValue.serverTimestamp(),
            version: 1,
          },
        },
        { merge: true }
      );
      summary.marked += 1;
      if (!summaryOnly) {
        console.log("[premium-tax-address-gate] marked", {
          subscriptionId: maskStripeId(subscription.id),
        });
      }
    } catch (error) {
      summary.failed += 1;
      console.error("[premium-tax-address-gate] failed", {
        subscriptionId: maskStripeId(subscription.id),
        message: clean(error?.message).slice(0, 300),
      });
    }
  }

  console.log(
    JSON.stringify(
      { event: "premium-tax-address-gate.summary", mode: apply ? "APPLY" : "DRY_RUN", summary },
      null,
      2
    )
  );
  if (summary.failed) process.exitCode = 1;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const discover = process.argv.includes("--discover");
  const repairAddresses = process.argv.includes("--repair-addresses-from-firestore");
  const repairAddressesFromPayments = process.argv.includes("--repair-addresses-from-stripe-payments");
  const markAddressRequired = process.argv.includes("--mark-address-required-in-firestore");
  const anyAddressRepair = repairAddresses || repairAddressesFromPayments;
  const summaryOnly = process.argv.includes("--summary-only");
  const allowStripeInvoiceFallback = process.argv.includes("--allow-stripe-invoice-fallback");
  const confirmation = getArg("confirm");
  const onlySubscriptionId = getArg("subscription");
  const dueBeforeRaw = getArg("due-before");
  const dueBeforeMs = dueBeforeRaw ? Date.parse(`${dueBeforeRaw}T23:59:59.999Z`) : null;
  const destinationPriceId = clean(process.env.STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE);
  const legacyPriceIds = parseCsv(process.env.STRIPE_PREMIUM_LEGACY_PRICE_IDS);
  const secretKey = clean(process.env.STRIPE_SECRET_KEY);

  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
  const stripe = new Stripe(secretKey);
  if (discover) {
    const prices = await discoverPremiumPrices(stripe);
    console.log(JSON.stringify({ event: "premium-tax-migration.discovery", prices }, null, 2));
    if (!prices.length) process.exitCode = 1;
    return;
  }
  if (!onlySubscriptionId && !legacyPriceIds.length) {
    throw new Error("Set STRIPE_PREMIUM_LEGACY_PRICE_IDS or pass --subscription=sub_...");
  }
  if (apply) {
    if (markAddressRequired) {
      if (process.env.PREMIUM_TAX_ADDRESS_GATE_MARKING_ENABLED !== "true") {
        throw new Error(
          "Address gate marking is disabled. Set PREMIUM_TAX_ADDRESS_GATE_MARKING_ENABLED=true explicitly."
        );
      }
      if (confirmation !== ADDRESS_GATE_CONFIRMATION) {
        throw new Error(`Address gate apply requires --confirm=${ADDRESS_GATE_CONFIRMATION}`);
      }
    } else if (anyAddressRepair) {
      if (process.env.PREMIUM_STRIPE_ADDRESS_REPAIR_ENABLED !== "true") {
        throw new Error("Address repair apply is disabled. Set PREMIUM_STRIPE_ADDRESS_REPAIR_ENABLED=true explicitly.");
      }
      if (confirmation !== ADDRESS_REPAIR_CONFIRMATION) {
        throw new Error(`Address repair apply requires --confirm=${ADDRESS_REPAIR_CONFIRMATION}`);
      }
    } else {
      if (process.env.PREMIUM_SUBSCRIPTION_TAX_MIGRATION_ENABLED !== "true") {
        throw new Error("Apply is disabled. Set PREMIUM_SUBSCRIPTION_TAX_MIGRATION_ENABLED=true explicitly.");
      }
      if (confirmation !== APPLY_CONFIRMATION) {
        throw new Error(`Apply requires --confirm=${APPLY_CONFIRMATION}`);
      }
    }
  }
  if (dueBeforeRaw && !Number.isFinite(dueBeforeMs)) throw new Error("Invalid --due-before date");

  const db = initFirestoreIfConfigured();
  const candidates = await listCandidates(stripe, legacyPriceIds, onlySubscriptionId);
  if (repairAddresses) {
    await runAddressRepair({ stripe, db, candidates, legacyPriceIds, apply, summaryOnly });
    return;
  }
  if (repairAddressesFromPayments) {
    await runPaymentAddressRepair({ stripe, candidates, legacyPriceIds, apply, summaryOnly });
    return;
  }
  if (markAddressRequired) {
    await runAddressGateMarking({ stripe, db, candidates, legacyPriceIds, apply, summaryOnly });
    return;
  }
  if (!destinationPriceId) throw new Error("Missing STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE");
  const destinationPrice = await stripe.prices.retrieve(destinationPriceId);
  const priceValidation = validateDestinationPrice(destinationPrice);
  if (!priceValidation.ok) {
    throw new Error(`Unsafe destination Price: ${priceValidation.reasons.join(", ")}`);
  }

  const summary = {
    scanned: candidates.length,
    considered: 0,
    eligible: 0,
    blocked: 0,
    migrated: 0,
    failed: 0,
    skippedAfterDueDate: 0,
    reasonCounts: {},
    previewTotals: {},
    billingSourceCounts: {},
  };

  console.log("[premium-tax-migration] start", {
    mode: apply ? "APPLY" : "DRY_RUN",
    destinationPriceId,
    legacyPriceIds,
    dueBefore: dueBeforeRaw || null,
    firestoreCheck: Boolean(db),
  });

  for (const subscription of candidates) {
    const periodEnd = periodEndFromSubscription(subscription);
    if (dueBeforeMs && (!periodEnd || periodEnd * 1000 > dueBeforeMs)) {
      summary.skippedAfterDueDate += 1;
      continue;
    }
    summary.considered += 1;

    const explicitSubscriptionLegacyPrices = onlySubscriptionId
      ? (subscription?.items?.data || [])
          .map((item) => clean(item?.price?.id))
          .filter((priceId) => priceId && priceId !== destinationPriceId)
      : [];
    const candidateLegacyPriceIds = legacyPriceIds.length
      ? legacyPriceIds
      : explicitSubscriptionLegacyPrices;
    const structural = subscriptionStructuralBlockers(subscription, candidateLegacyPriceIds);
    const customerId = customerIdFromSubscription(subscription);
    const row = {
      subscriptionId: maskStripeId(subscription.id),
      renewalAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      status: subscription.status,
      reasons: [...structural.reasons],
    };

    if (row.reasons.length) {
      summary.blocked += 1;
      addReasonCounts(summary, row.reasons);
      if (!summaryOnly) console.warn("[premium-tax-migration] blocked", row);
      continue;
    }

    try {
      const customer = await resolveCustomer(stripe, subscription);
      if (!customer || customer.deleted) row.reasons.push("customer_missing_or_deleted");
      else if (!hasUsableTaxAddress(customer)) row.reasons.push("customer_tax_address_incomplete");

      const user = await findPremiumUser(db, subscription, customerId);
      if (!user.ok) row.reasons.push(user.reason);
      else if (!user.hasBillingProfile && !allowStripeInvoiceFallback) {
        row.reasons.push("missing_premium_billing_profile");
      } else if (!user.hasBillingProfile && !hasUsableInvoiceIdentity(customer)) {
        row.reasons.push("stripe_invoice_identity_incomplete");
      }
      row.billingSource = !user?.ok
        ? "unavailable"
        : user.hasBillingProfile
          ? "firestore_profile"
          : "stripe_invoice_snapshot";

      let previewAssessment = null;
      if (!row.reasons.length) {
        const preview = await previewMigration(stripe, subscription, structural.item, destinationPriceId);
        previewAssessment = assessPreview(preview, customerCountry(customer), destinationPrice);
        if (!previewAssessment.ok) row.reasons.push(...previewAssessment.reasons);
      }
      row.preview = previewAssessment;

      if (row.reasons.length) {
        summary.blocked += 1;
        addReasonCounts(summary, row.reasons);
        if (!summaryOnly) console.warn("[premium-tax-migration] blocked", row);
        continue;
      }

      summary.eligible += 1;
      summary.billingSourceCounts[row.billingSource] =
        (summary.billingSourceCounts[row.billingSource] || 0) + 1;
      const previewKey = `${row.preview.currency}_${row.preview.subtotal}_${row.preview.tax}_${row.preview.total}`;
      summary.previewTotals[previewKey] = (summary.previewTotals[previewKey] || 0) + 1;
      if (!apply) {
        if (!summaryOnly) console.log("[premium-tax-migration] eligible", row);
        continue;
      }

      await migrateOne(stripe, subscription, structural.item, destinationPriceId, user.uid);
      const updated = await stripe.subscriptions.retrieve(subscription.id);
      const updatedPriceId = clean(updated?.items?.data?.[0]?.price?.id);
      if (updatedPriceId !== destinationPriceId || updated?.automatic_tax?.enabled !== true) {
        throw new Error("post_update_subscription_validation_failed");
      }
      summary.migrated += 1;
      if (db && user?.ok) {
        try {
          await db.collection("Users").doc(user.uid).set(
            {
              premiumTaxAddressGate: {
                required: false,
                readyForMigration: false,
                migrationCompleted: true,
                migratedAt: admin.firestore.FieldValue.serverTimestamp(),
                version: 1,
              },
            },
            { merge: true }
          );
        } catch (gateError) {
          console.warn("[premium-tax-migration] gate_clear_failed", {
            subscriptionId: maskStripeId(subscription.id),
            message: clean(gateError?.message).slice(0, 300),
          });
        }
      }
      if (!summaryOnly) {
        console.log("[premium-tax-migration] migrated", {
          subscriptionId: maskStripeId(subscription.id),
          renewalAt: row.renewalAt,
          preview: row.preview,
        });
      }
    } catch (error) {
      summary.failed += 1;
      console.error("[premium-tax-migration] failed", {
        subscriptionId: maskStripeId(subscription.id),
        message: clean(error?.message).slice(0, 300),
      });
    }
  }

  console.log(JSON.stringify({ event: "premium-tax-migration.summary", mode: apply ? "APPLY" : "DRY_RUN", summary }, null, 2));
  if (summary.failed) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[premium-tax-migration] fatal", { message: clean(error?.message).slice(0, 500) });
    process.exitCode = 1;
  });
}

module.exports = {
  assessPreview,
  buildStripeAddressFromPremiumProfile,
  discoverPremiumPrices,
  hasUsableInvoiceIdentity,
  hasUsableTaxAddress,
  validateStripeAddressCandidate,
  parseCsv,
  periodEndFromSubscription,
  subscriptionStructuralBlockers,
  validateDestinationPrice,
};
