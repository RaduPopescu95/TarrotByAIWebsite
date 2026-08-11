/**
 * Server-only VAT helpers that may read Firestore settings.
 * Do not import this from client pages / browser bundles.
 */
import { getVatPercentage } from "./globalSettings";
import { getFixedVatTaxRateId as getFixedVatTaxRateIdCore } from "./stripeFixedVat";

export async function getFixedVatTaxRateId(stripe, env = process.env) {
  const percentage = await getVatPercentage();
  return getFixedVatTaxRateIdCore(stripe, env, percentage);
}
