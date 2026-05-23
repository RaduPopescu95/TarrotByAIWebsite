export const AD_PROVIDERS = Object.freeze({
  ADSENSE: "adsense",
  MONETAG: "monetag",
  ADSTERRA: "adsterra",
  NONE: "none",
});

export const AD_SLOT_KEYS = Object.freeze({
  AFTER_HERO: "after-hero",
  IN_FEED: "in-feed",
});

export const PUBLIC_CONTENT_ROUTE_PATTERNS = Object.freeze([
  /^\/$/,
  /^\/news(?:\/|$)/,
  /^\/videouri(?:\/|$)/,
  /^\/about(?:\/|$)/,
  /^\/despre-platforma(?:\/|$)/,
  /^\/politica-platforma(?:\/|$)/,
  /^\/privacypolicy(?:\/|$)/,
]);

export const EXCLUDED_ROUTE_PREFIXES = Object.freeze([
  "/dashboard",
  "/admin",
  "/login",
  "/signin",
  "/signup",
  "/settings",
  "/cont-client",
  "/panou-utilizator",
  "/meeting",
  "/meeting-admin",
  "/meeting-daily",
  "/meeting-agora",
  "/checkout",
  "/premium",
  "/abonament",
  "/conferinta-grup",
  "/calendar",
  "/calendar-admin",
  "/calendar-conferinte-grup",
  "/recording",
  "/consultatii",
  "/rezervari",
  "/rezervarile-mele",
  "/detalii-rezervare",
  "/facturi-client-consultatii",
  "/facturi-clienti",
  "/inregistrari-acces",
  "/inregistrari-descarcare",
  "/courses/purchased",
  "/courses/[courseId]",
]);

export const SLOT_ROUTE_RULES = Object.freeze([
  {
    routePattern: /^\/$/,
    slots: [AD_SLOT_KEYS.AFTER_HERO, AD_SLOT_KEYS.IN_FEED],
  },
  {
    routePattern: /^\/news(?:\/|$)/,
    slots: [AD_SLOT_KEYS.AFTER_HERO, AD_SLOT_KEYS.IN_FEED],
  },
  {
    routePattern: /^\/videouri(?:\/|$)/,
    slots: [AD_SLOT_KEYS.AFTER_HERO, AD_SLOT_KEYS.IN_FEED],
  },
]);

export const BLOCKED_SECONDARY_FORMATS = Object.freeze([
  "popunder",
  "onclick",
  "smartlink",
]);
