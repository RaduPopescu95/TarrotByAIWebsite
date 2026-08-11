/**
 * Client-side VAT helpers for pages that render net catalog prices.
 *
 * Kept free of server imports so it can ship in the browser bundle. The rate is
 * fetched from `/api/config/vat`, with the current Romanian rate as fallback.
 */

import { useEffect, useState } from "react";

export const DEFAULT_VAT_PERCENTAGE = 21;

let cachedVatPercentage = null;
let inFlightRequest = null;

export function normalizeNetAmount(value) {
  if (typeof value === "string" && !value.trim()) return null;
  if (value === null || value === undefined || typeof value === "boolean") return null;
  const numeric = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

/**
 * Net major amount (e.g. 300 RON) to VAT-inclusive major amount (363 RON).
 * Rounds on integer minor units so it matches Stripe's own tax rounding.
 * @returns {number|null}
 */
export function grossFromNet(netMajor, vatPercentage = DEFAULT_VAT_PERCENTAGE) {
  const net = normalizeNetAmount(netMajor);
  if (net === null) return null;
  const percentage = Number.isFinite(Number(vatPercentage))
    ? Number(vatPercentage)
    : DEFAULT_VAT_PERCENTAGE;
  const netMinor = Math.round(net * 100);
  return (netMinor + Math.round((netMinor * percentage) / 100)) / 100;
}

/**
 * Formats an amount that already includes VAT.
 * @returns {string} localized amount, or "" for unusable input
 */
export function formatCurrencyAmount(
  amountMajor,
  { currency = "RON", locale = "ro-RO" } = {}
) {
  const amount = normalizeNetAmount(amountMajor);
  if (amount === null) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * @returns {string} localized VAT-inclusive amount, or "" for unusable input
 */
export function formatGross(
  netMajor,
  { vatPercentage = DEFAULT_VAT_PERCENTAGE, currency = "RON", locale = "ro-RO" } = {}
) {
  const gross = grossFromNet(netMajor, vatPercentage);
  if (gross === null) return "";
  return formatCurrencyAmount(gross, { currency, locale });
}

async function fetchVatPercentage() {
  const res = await fetch("/api/config/vat");
  const data = await res.json();
  const numeric = Number(data?.vatPercentage);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
    ? numeric
    : DEFAULT_VAT_PERCENTAGE;
}

export function useVatPercentage() {
  const [vatPercentage, setVatPercentage] = useState(
    cachedVatPercentage ?? DEFAULT_VAT_PERCENTAGE
  );

  useEffect(() => {
    if (cachedVatPercentage !== null) {
      setVatPercentage(cachedVatPercentage);
      return;
    }
    let active = true;
    if (!inFlightRequest) {
      inFlightRequest = fetchVatPercentage()
        .then((value) => {
          cachedVatPercentage = value;
          return value;
        })
        .catch(() => DEFAULT_VAT_PERCENTAGE)
        .finally(() => {
          inFlightRequest = null;
        });
    }
    inFlightRequest.then((value) => {
      if (active) setVatPercentage(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return vatPercentage;
}
