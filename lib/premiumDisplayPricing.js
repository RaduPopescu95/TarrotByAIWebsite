/**
 * Premium list price for public display.
 *
 * Stripe stores the net amount with `tax_behavior=exclusive`, so every customer
 * facing surface must add VAT itself. Keeping this in one place means a price or
 * VAT change never requires touching translations or a mobile release.
 */

import { calculateFixedVatMinor } from "./stripeFixedVat";
import { resolvePremiumStripePriceId } from "./stripePremiumEnv";

const PRICE_SNAPSHOT_TTL_MS = 10 * 60 * 1000;

let priceSnapshotCache = { priceId: "", value: null, expiresAt: 0 };

export function clearPremiumDisplayPricingCache() {
  priceSnapshotCache = { priceId: "", value: null, expiresAt: 0 };
}

/**
 * @param {{ netAmountCents: number, currency: string, interval?: string|null }} snapshot
 * @param {number} vatPercentage
 */
export function buildPremiumDisplayPricing(snapshot, vatPercentage) {
  const vat = calculateFixedVatMinor(snapshot.netAmountCents, vatPercentage);
  return {
    currency: snapshot.currency,
    interval: snapshot.interval || null,
    vatPercentage: vat.percentage,
    priceIncludesVat: true,
    netAmountCents: vat.net,
    taxAmountCents: vat.tax,
    totalAmountCents: vat.total,
    netAmount: vat.net / 100,
    totalAmount: vat.total / 100,
  };
}

async function readPriceSnapshot(stripe) {
  const priceId = resolvePremiumStripePriceId();
  if (!priceId) return null;

  const now = Date.now();
  if (priceSnapshotCache.priceId === priceId && priceSnapshotCache.expiresAt > now) {
    return priceSnapshotCache.value;
  }

  const price = await stripe.prices.retrieve(priceId);
  const netAmountCents = Number(price?.unit_amount);
  if (!Number.isFinite(netAmountCents)) return null;

  const snapshot = {
    netAmountCents,
    currency: String(price?.currency || "eur").toUpperCase(),
    interval: price?.recurring?.interval || null,
  };
  priceSnapshotCache = {
    priceId,
    value: snapshot,
    expiresAt: now + PRICE_SNAPSHOT_TTL_MS,
  };
  return snapshot;
}

/**
 * Returns null when Premium billing is not configured or the price cannot be
 * read, so callers can fall back to their own copy instead of failing.
 */
export async function getPremiumDisplayPricing(stripe, vatPercentage) {
  try {
    const snapshot = await readPriceSnapshot(stripe);
    if (!snapshot) return null;
    return buildPremiumDisplayPricing(snapshot, vatPercentage);
  } catch (error) {
    console.error(
      "[premium.displayPricing] price_retrieve_failed",
      error?.message || error
    );
    return null;
  }
}
