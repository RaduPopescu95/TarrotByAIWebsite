/** Registry of partner promotion placement zones (web + mobile). */
export const PARTNER_PROMOTION_ZONES = {
  web_home_top: {
    id: "web_home_top",
    platform: "web",
    label: "Homepage — sus",
  },
  web_home_mid: {
    id: "web_home_mid",
    platform: "web",
    label: "Homepage — mijloc",
  },
  web_news_list: {
    id: "web_news_list",
    platform: "web",
    label: "Listă știri",
  },
  web_article_detail: {
    id: "web_article_detail",
    platform: "web",
    label: "Articol — detaliu",
  },
  web_feature_reading: {
    id: "web_feature_reading",
    platform: "web",
    label: "Pagini citiri / tarot",
  },
  app_dashboard: {
    id: "app_dashboard",
    platform: "mobile",
    label: "App — dashboard",
  },
  app_news_list: {
    id: "app_news_list",
    platform: "mobile",
    label: "App — listă știri",
  },
  app_article_modal: {
    id: "app_article_modal",
    platform: "mobile",
    label: "App — modal articol",
  },
  app_tarot: {
    id: "app_tarot",
    platform: "mobile",
    label: "App — Tarot",
  },
  app_video_library: {
    id: "app_video_library",
    platform: "mobile",
    label: "App — videotecă",
  },
};

export const PARTNER_PROMOTION_ZONE_IDS = Object.keys(PARTNER_PROMOTION_ZONES);

export const ALLOWED_LINK_TYPES = ["website", "whatsapp", "store", "offer"];

export const ALLOWED_LOCALES = ["all", "ro", "en"];

export function isValidPartnerPromotionZone(value) {
  return typeof value === "string" && PARTNER_PROMOTION_ZONE_IDS.includes(value.trim());
}

export function listZonesForPlatform(platform) {
  const norm = typeof platform === "string" ? platform.trim().toLowerCase() : "";
  return PARTNER_PROMOTION_ZONE_IDS.filter((id) => {
    const zone = PARTNER_PROMOTION_ZONES[id];
    return zone && (norm === "" || zone.platform === norm || zone.platform === "web" && norm === "web" || zone.platform === "mobile" && norm === "mobile");
  }).map((id) => PARTNER_PROMOTION_ZONES[id]);
}
