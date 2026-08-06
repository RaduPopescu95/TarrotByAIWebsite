/**
 * Opt-in consent for Premium 5 EUR → 5 EUR + VAT (RO: 6.05 EUR).
 * Address completion alone is NOT acceptance.
 */

export const PREMIUM_PRICE_CHANGE_CONSENT_VERSION = "v1_6_05";
export const PREMIUM_PRICE_CHANGE_OLD_TOTAL_CENTS = 500;
export const PREMIUM_PRICE_CHANGE_NEW_TOTAL_CENTS = 605;
export const PREMIUM_TAX_MIGRATION_METADATA = "exclusive_v1";
export const PREMIUM_ACCEPT_PRICE_PATH = "/premium/accept-price";
export const PREMIUM_ACCEPT_PAGE_URL = "https://www.cristinazurba.com/premium/accept-price";

export const PREMIUM_PRICE_CHANGE_CONSENT_TEXT_RO =
  "Sunt de acord ca, începând cu următoarea reînnoire, abonamentul meu Premium să fie facturat la prețul de 5 EUR + TVA aplicabil (pentru România: 6,05 EUR/lună, TVA inclus).";

export const PRICE_CHANGE_SEGMENTS = {
  A_NEMIGRAT: "A_nemigrat",
  B_MIGRAT_NEFACTURAT: "B_migrat_nefacturat_605",
  C_DEJA_605: "C_deja_605",
  OTHER: "other",
};

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function hasValidPriceChangeConsent(
  userData,
  version = PREMIUM_PRICE_CHANGE_CONSENT_VERSION
) {
  const consent = userData?.premiumPriceChangeConsent;
  if (!consent || typeof consent !== "object") return false;
  if (clean(consent.version) !== version) return false;
  if (clean(consent.status) !== "accepted") return false;
  return Boolean(consent.acceptedAt);
}

export function buildConsentRecord({
  subscriptionId,
  oldPriceId,
  newPriceId,
  renewalAtIso,
  billingCountry,
  uid,
  consentText = PREMIUM_PRICE_CHANGE_CONSENT_TEXT_RO,
  version = PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
  serverTimestamp,
}) {
  return {
    version,
    status: "accepted",
    consentText,
    oldTotalCents: PREMIUM_PRICE_CHANGE_OLD_TOTAL_CENTS,
    newTotalCents: PREMIUM_PRICE_CHANGE_NEW_TOTAL_CENTS,
    oldPriceId: clean(oldPriceId) || null,
    newPriceId: clean(newPriceId) || null,
    subscriptionId: clean(subscriptionId) || null,
    renewalAt: clean(renewalAtIso) || null,
    billingCountry: clean(billingCountry).toUpperCase() || null,
    uid: clean(uid) || null,
    acceptedAt: serverTimestamp || new Date().toISOString(),
    noticeVersion: version,
  };
}

/**
 * Classify a renewing premium subscription for price-change outreach.
 * @param {{ priceId?: string, taxMigration?: string, latestAmountPaid?: number|null, exclusivePriceId?: string, legacyPriceIds?: string[] }} input
 */
export function classifyPriceChangeSegment(input = {}) {
  const priceId = clean(input.priceId);
  const taxMigration = clean(input.taxMigration);
  const exclusivePriceId = clean(input.exclusivePriceId);
  const legacyPriceIds = Array.isArray(input.legacyPriceIds)
    ? input.legacyPriceIds.map(clean).filter(Boolean)
    : [];
  const latestAmountPaid =
    input.latestAmountPaid == null ? null : Number(input.latestAmountPaid);

  if (latestAmountPaid === PREMIUM_PRICE_CHANGE_NEW_TOTAL_CENTS) {
    return PRICE_CHANGE_SEGMENTS.C_DEJA_605;
  }

  const onExclusive =
    (Boolean(exclusivePriceId) && priceId === exclusivePriceId) ||
    taxMigration === PREMIUM_TAX_MIGRATION_METADATA;

  if (onExclusive) {
    return PRICE_CHANGE_SEGMENTS.B_MIGRAT_NEFACTURAT;
  }

  if (legacyPriceIds.includes(priceId)) {
    return PRICE_CHANGE_SEGMENTS.A_NEMIGRAT;
  }

  return PRICE_CHANGE_SEGMENTS.OTHER;
}

export function subscriptionPrimaryPriceId(subscription) {
  return clean(subscription?.items?.data?.[0]?.price?.id);
}

export function subscriptionTaxMigrationMeta(subscription) {
  return clean(subscription?.metadata?.taxMigration);
}

export function findLegacySubscriptionItem(subscription, legacyPriceIds) {
  const allow = new Set((legacyPriceIds || []).map(clean).filter(Boolean));
  const items = subscription?.items?.data || [];
  return items.find((item) => allow.has(clean(item?.price?.id))) || null;
}

export function findExclusiveSubscriptionItem(subscription, exclusivePriceId) {
  const want = clean(exclusivePriceId);
  if (!want) return null;
  const items = subscription?.items?.data || [];
  return items.find((item) => clean(item?.price?.id) === want) || null;
}

/**
 * Move subscription item to exclusive (VAT-exclusive) price. No immediate proration charge.
 */
export async function migrateSubscriptionToExclusivePrice(
  stripe,
  { subscription, item, destinationPriceId, uid }
) {
  const subId = clean(subscription?.id);
  const itemId = clean(item?.id);
  const priceId = clean(destinationPriceId);
  if (!subId || !itemId || !priceId) {
    throw new Error("migrateSubscriptionToExclusivePrice_missing_args");
  }
  return stripe.subscriptions.update(
    subId,
    {
      automatic_tax: { enabled: true },
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
      items: [{ id: itemId, price: priceId, quantity: 1 }],
      metadata: {
        ...(subscription.metadata || {}),
        flow: "site_premium",
        uid: clean(uid) || clean(subscription?.metadata?.uid),
        taxMigration: PREMIUM_TAX_MIGRATION_METADATA,
        priceChangeConsentVersion: PREMIUM_PRICE_CHANGE_CONSENT_VERSION,
      },
    },
    {
      idempotencyKey: `premium-tax-exclusive-consent-v1-${subId}-${priceId}`,
    }
  );
}

/**
 * Roll exclusive (unaccepted) subscription back to legacy inclusive price. No immediate charge.
 */
export async function rollbackSubscriptionToLegacyPrice(
  stripe,
  { subscription, item, legacyPriceId, uid }
) {
  const subId = clean(subscription?.id);
  const itemId = clean(item?.id);
  const priceId = clean(legacyPriceId);
  if (!subId || !itemId || !priceId) {
    throw new Error("rollbackSubscriptionToLegacyPrice_missing_args");
  }
  const nextMeta = { ...(subscription.metadata || {}) };
  delete nextMeta.taxMigration;
  delete nextMeta.priceChangeConsentVersion;
  if (clean(uid)) nextMeta.uid = clean(uid);
  nextMeta.flow = nextMeta.flow || "site_premium";
  nextMeta.taxMigrationRollback = "unaccepted_exclusive_v1";

  return stripe.subscriptions.update(
    subId,
    {
      automatic_tax: { enabled: false },
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
      items: [{ id: itemId, price: priceId, quantity: 1 }],
      metadata: nextMeta,
    },
    {
      idempotencyKey: `premium-tax-rollback-unaccepted-v1-${subId}-${priceId}`,
    }
  );
}

export function resolveExclusivePriceIdFromEnv(env = process.env) {
  const dev = env.NODE_ENV === "development";
  const exclusive = clean(
    env[dev ? "STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE_TEST" : "STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE"]
  );
  if (exclusive) return exclusive;
  return clean(env.STRIPE_PREMIUM_PRICE_ID_EXCLUSIVE);
}

export function parseLegacyPriceIdsFromEnv(env = process.env) {
  return [
    ...new Set(
      clean(env.STRIPE_PREMIUM_LEGACY_PRICE_IDS)
        .split(",")
        .map(clean)
        .filter(Boolean)
    ),
  ];
}
