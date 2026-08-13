#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Read-only: previews the next invoice for every paying premium subscription
 * so we can confirm what will actually be collected at the next renewal.
 *
 * Usage: node scripts/preview-premium-next-invoices.cjs [--live]
 */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const LIVE = process.argv.includes("--live");
const PAYING_STATUSES = new Set(["active", "trialing", "past_due"]);
const EXPECTED_TOTAL_CENTS = 605;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The classic upcoming-invoice endpoint rejects flexible-billing subscriptions,
 * so go through the newer preview endpoint with an explicit API version.
 */
async function previewNextInvoice(secretKey, subscriptionId) {
  const res = await fetch("https://api.stripe.com/v1/invoices/create_preview", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": "2025-03-31.basil",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ subscription: subscriptionId }),
  });
  const body = await res.json();
  if (!res.ok) return { error: body?.error?.message || `http_${res.status}` };
  const tax = Array.isArray(body.total_taxes)
    ? body.total_taxes.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    : Number(body.tax || 0);
  return {
    subtotal: Number(body.subtotal),
    tax,
    total: Number(body.total),
    currency: String(body.currency || "").toUpperCase(),
    periodEnd: body.period_end,
  };
}

async function main() {
  const secretKey = LIVE
    ? clean(process.env.STRIPE_SECRET_KEY_LIVE)
    : clean(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) throw new Error("Missing Stripe secret key");
  console.log(`Mode: ${secretKey.startsWith("sk_live") ? "LIVE" : "TEST"}\n`);

  const stripe = new Stripe(secretKey);
  const subs = [];
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    if (PAYING_STATUSES.has(sub.status)) subs.push(sub);
  }

  const buckets = {};
  const deviations = [];
  const cancelling = [];
  let previewed = 0;

  for (const sub of subs) {
    if (sub.cancel_at_period_end === true || sub.cancel_at) {
      cancelling.push(sub.id);
      continue;
    }
    const preview = await previewNextInvoice(secretKey, sub.id);
    previewed += 1;
    if (preview.error) {
      deviations.push({ subscriptionId: sub.id, status: sub.status, error: preview.error });
      continue;
    }
    const key = `${(preview.subtotal / 100).toFixed(2)} net + ${(preview.tax / 100).toFixed(
      2
    )} TVA = ${(preview.total / 100).toFixed(2)} ${preview.currency}`;
    buckets[key] = (buckets[key] || 0) + 1;
    if (preview.total !== EXPECTED_TOTAL_CENTS) {
      deviations.push({
        subscriptionId: sub.id,
        status: sub.status,
        total: (preview.total / 100).toFixed(2),
        tax: (preview.tax / 100).toFixed(2),
        currency: preview.currency,
        renewsOn: preview.periodEnd
          ? new Date(preview.periodEnd * 1000).toISOString().slice(0, 10)
          : null,
      });
    }
  }

  console.log(`Paying subscriptions: ${subs.length}`);
  console.log(`  scheduled to cancel, will not be charged: ${cancelling.length}`);
  console.log(`  previewed: ${previewed}`);

  console.log("\n=== NEXT RENEWAL AMOUNTS ===");
  Object.entries(buckets)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => console.log(`${String(count).padStart(4)} x  ${key}`));

  console.log("\n=== DEVIATIONS FROM 6.05 EUR ===");
  console.log(deviations.length ? JSON.stringify(deviations, null, 2) : "(none)");
}

main().catch((err) => {
  console.error("PREVIEW FAILED:", err?.message || err);
  process.exit(1);
});
