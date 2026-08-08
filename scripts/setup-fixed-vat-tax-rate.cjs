#!/usr/bin/env node
/* eslint-disable no-console */

const path = require("path");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const LIVE = process.argv.includes("--live");
const TEST = process.argv.includes("--test");
const APPLY = process.argv.includes("--apply");
const confirmationArg = process.argv.find((arg) => arg.startsWith("--confirm="));
const confirmation = confirmationArg ? confirmationArg.slice("--confirm=".length).trim() : "";

if (LIVE === TEST) throw new Error("Pass exactly one of --live or --test");

const keyName = LIVE ? "STRIPE_SECRET_KEY_LIVE" : "STRIPE_SECRET_KEY";
const key = String(process.env[keyName] || "").trim();
const expectedPrefix = LIVE ? "sk_live_" : "sk_test_";
if (!key.startsWith(expectedPrefix)) throw new Error(`${keyName} must be a ${expectedPrefix} key`);

if (APPLY) {
  if (process.env.STRIPE_FIXED_VAT_SETUP_ENABLED !== "true") {
    throw new Error("Set STRIPE_FIXED_VAT_SETUP_ENABLED=true for apply");
  }
  if (confirmation !== "CREATE_FIXED_VAT_21") {
    throw new Error("Apply requires --confirm=CREATE_FIXED_VAT_21");
  }
}

const stripe = new Stripe(key);

function matches(rate) {
  return (
    rate?.active === true &&
    rate?.inclusive === false &&
    Number(rate?.percentage) === 21 &&
    rate?.metadata?.policy === "fixed_vat_21_global"
  );
}

(async () => {
  const rates = [];
  for await (const rate of stripe.taxRates.list({ active: true, limit: 100 })) {
    if (matches(rate)) rates.push(rate);
  }

  if (rates.length > 1) {
    throw new Error(`Multiple matching fixed VAT rates found: ${rates.map((r) => r.id).join(",")}`);
  }

  let rate = rates[0] || null;
  if (!rate && APPLY) {
    rate = await stripe.taxRates.create({
      display_name: "TVA",
      description: "TVA fix 21% aplicat global",
      jurisdiction: "România",
      percentage: 21,
      inclusive: false,
      metadata: {
        policy: "fixed_vat_21_global",
        managedBy: "setup-fixed-vat-tax-rate.cjs",
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: LIVE ? "live" : "test",
        operation: APPLY ? "apply" : "audit",
        found: Boolean(rate),
        taxRate: rate
          ? {
              id: rate.id,
              active: rate.active,
              inclusive: rate.inclusive,
              percentage: rate.percentage,
              displayName: rate.display_name,
            }
          : null,
        envName: LIVE
          ? "STRIPE_FIXED_VAT_TAX_RATE_ID"
          : "STRIPE_FIXED_VAT_TAX_RATE_ID_TEST",
      },
      null,
      2
    )
  );

  if (!rate) process.exitCode = 2;
})().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
