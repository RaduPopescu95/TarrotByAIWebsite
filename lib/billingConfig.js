const truthy = new Set(["1", "true", "yes", "on"]);

export const ANALYSIS_PRODUCT_KEYS = Object.freeze([
  "personal",
  "astrogramaOthers",
  "sinastrieOnePerson",
  "sinastrieOthers",
]);

function envFlag(name) {
  return truthy.has(String(process.env[name] || "").trim().toLowerCase());
}

function safeProvider(value, enabled) {
  const provider = String(value || "").trim().toLowerCase();
  if (!enabled) return "stripe";
  return provider === "revenuecat" ? "revenuecat" : "stripe";
}

function safeProductId(value) {
  return typeof value === "string" ? value.trim().slice(0, 255) : "";
}

function parseProductMap(name) {
  const raw = process.env[name];
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([productId, itemId]) => [safeProductId(productId), safeProductId(itemId)])
        .filter(([productId, itemId]) => productId && itemId)
    );
  } catch {
    return {};
  }
}

export function getAnalysisProductMap() {
  return Object.fromEntries(
    [
      [process.env.REVENUECAT_ANALYSIS_PRODUCT_PERSONAL, "personal"],
      [
        process.env.REVENUECAT_ANALYSIS_PRODUCT_ASTROGRAMA_OTHERS,
        "astrogramaOthers",
      ],
      [
        process.env.REVENUECAT_ANALYSIS_PRODUCT_SINASTRIE_ONE_PERSON,
        "sinastrieOnePerson",
      ],
      [process.env.REVENUECAT_ANALYSIS_PRODUCT_SINASTRIE_OTHERS, "sinastrieOthers"],
    ]
      .map(([productId, key]) => [safeProductId(productId), key])
      .filter(([productId]) => productId)
  );
}

export function getStaticCourseProductMap() {
  return parseProductMap("REVENUECAT_COURSE_PRODUCT_MAP");
}

export function getStaticBundleProductMap() {
  return parseProductMap("REVENUECAT_BUNDLE_PRODUCT_MAP");
}

export function getBillingConfig() {
  const premiumEnabled = envFlag("ANDROID_BILLING_PREMIUM_ENABLED");
  const analysesEnabled = envFlag("ANDROID_BILLING_ANALYSES_ENABLED");
  const analysisMap = getAnalysisProductMap();

  return {
    android: {
      premium: {
        enabled: premiumEnabled,
        provider: safeProvider(process.env.ANDROID_BILLING_PREMIUM_PROVIDER, premiumEnabled),
        productId: safeProductId(process.env.REVENUECAT_PREMIUM_PRODUCT_ID) || null,
        entitlementId:
          safeProductId(process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID) || "premium",
      },
      courses: {
        enabled: false,
        provider: "stripe",
      },
      analyses: {
        enabled: analysesEnabled,
        provider: safeProvider(process.env.ANDROID_BILLING_ANALYSES_PROVIDER, analysesEnabled),
        productIds: Object.fromEntries(
          ANALYSIS_PRODUCT_KEYS.map((key) => [
            key,
            Object.entries(analysisMap).find(
              ([productId, mappedKey]) => productId && mappedKey === key
            )?.[0] || null,
          ])
        ),
      },
    },
  };
}

const ANALYSIS_PUBLIC_KEYS = Object.freeze({
  personal: "astrogama_natala",
  astrogramaOthers: "astrogama_natala_other_person",
  sinastrieOnePerson: "sinastrie_relatie",
  sinastrieOthers: "sinastrie_relatie_others",
});

/**
 * Client-safe Android routing. Environment flags declare which integrations
 * are deployed; Firestore settings decide whether new Android builds use them.
 * Missing/invalid settings always fail closed to Stripe.
 */
export function getPublicBillingConfig(settings = {}) {
  const config = getBillingConfig();
  const providerFor = (flow, settingName) =>
    config.android[flow]?.enabled === true &&
    config.android[flow]?.provider === "revenuecat" &&
    settings?.[settingName] === "revenuecat"
      ? "revenuecat"
      : "stripe";

  return {
    providers: {
      premium: providerFor("premium", "androidBillingPremiumProvider"),
      courses: "stripe",
      analyses: providerFor("analyses", "androidBillingAnalysesProvider"),
    },
    revenueCat: {
      premiumProductId: config.android.premium.productId,
      analysisProductIds: Object.fromEntries(
        Object.entries(ANALYSIS_PUBLIC_KEYS)
          .map(([internalKey, productCode]) => [
            productCode,
            config.android.analyses.productIds[internalKey] || null,
          ])
          .filter(([, productId]) => Boolean(productId))
      ),
    },
  };
}

export function isRevenueCatFlowEnabled(flow) {
  const row = getBillingConfig().android[flow];
  return row?.enabled === true && row?.provider === "revenuecat";
}

export function normalizeRevenueCatProductId(value) {
  const raw = safeProductId(value);
  return raw.includes(":") ? raw.split(":")[0] : raw;
}
