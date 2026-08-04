/**
 * În `npm run dev` (NODE_ENV=development): preferă preț și secret webhook dedicate testului local,
 * ca să nu amesteci Live Price / webhook-ul din producție.
 */

function trimmed(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export function isStripePremiumUsingLocalOverrides() {
  return process.env.NODE_ENV === "development";
}

/** Price pentru Checkout premium: în dev folosește STRIPE_PREMIUM_PRICE_ID_TEST dacă este setat. */
export function resolvePremiumStripePriceId() {
  const dev = process.env.NODE_ENV === "development";
  const exclusive = trimmed(dev ? "STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE_TEST" : "STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE");
  if (exclusive) return exclusive;
  const testId = trimmed("STRIPE_PREMIUM_PRICE_ID_TEST");
  const prodId = trimmed("STRIPE_PREMIUM_PRICE_ID");
  if (dev && testId) return testId;
  return prodId || testId || "";
}

/**
 * Secret pentru verificarea semnăturii la `/api/stripe/premium/webhook`.
 * În dev: dacă STRIPE_WEBHOOK_SECRET_ABONAMENT_TEST este setat, îl folosește (ex. Stripe CLI `listen`).
 */
export function resolvePremiumAbonamentWebhookSecret() {
  const dev = process.env.NODE_ENV === "development";
  const testSecret = trimmed("STRIPE_WEBHOOK_SECRET_ABONAMENT_TEST");
  if (dev && testSecret) return testSecret;
  const explicit = trimmed("STRIPE_WEBHOOK_SECRET_ABONAMENT");
  const legacy = trimmed("STRIPE_WEBHOOK_SECRET");
  return explicit || legacy || "";
}
