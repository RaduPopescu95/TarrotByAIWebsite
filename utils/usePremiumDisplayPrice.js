/**
 * Premium list price for the subscribe page, VAT included.
 *
 * The amount comes from `/api/premium/public-config`, which reads the live
 * Stripe price and adds the VAT rate configured in the dashboard. The fallback
 * below is only used when that request fails.
 */

import { useEffect, useState } from "react";

const FALLBACK_TOTAL_CENTS = 605;
const FALLBACK_CURRENCY = "EUR";

let cachedPricing = null;
let inFlightRequest = null;

export function formatPremiumAmount(totalCents, currency, locale) {
  const amount = Number(totalCents) / 100;
  if (!Number.isFinite(amount)) return "";
  try {
    return new Intl.NumberFormat(locale || "ro-RO", {
      style: "currency",
      currency: currency || FALLBACK_CURRENCY,
      currencyDisplay: "code",
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency || FALLBACK_CURRENCY}`;
  }
}

async function fetchPremiumPricing() {
  const res = await fetch("/api/premium/public-config");
  const data = await res.json();
  const pricing = data?.premiumPricing;
  if (!pricing || !Number.isFinite(Number(pricing.totalAmountCents))) return null;
  return pricing;
}

/**
 * @param {string} [locale]
 * @returns {{ pricing: object|null, priceText: string, vatPercentage: number|null }}
 */
export function usePremiumDisplayPrice(locale) {
  const [pricing, setPricing] = useState(cachedPricing);

  useEffect(() => {
    if (cachedPricing) return;
    let active = true;
    if (!inFlightRequest) {
      inFlightRequest = fetchPremiumPricing()
        .then((value) => {
          if (value) cachedPricing = value;
          return value;
        })
        .catch(() => null)
        .finally(() => {
          inFlightRequest = null;
        });
    }
    inFlightRequest.then((value) => {
      if (active && value) setPricing(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const totalCents = pricing?.totalAmountCents ?? FALLBACK_TOTAL_CENTS;
  const currency = pricing?.currency || FALLBACK_CURRENCY;

  return {
    pricing: pricing || null,
    priceText: formatPremiumAmount(totalCents, currency, locale),
    vatPercentage: pricing?.vatPercentage ?? null,
  };
}
