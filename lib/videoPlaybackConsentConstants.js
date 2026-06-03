export const VIDEO_PLAYBACK_TERMS_VERSION = "2026-06-02-v1";

export const VIDEO_PLAYBACK_CONSENT_COLLECTION = "videoPlaybackConsents";

export const VALID_CONSENT_ACTIONS = new Set(["accept", "view"]);
export const VALID_CONTENT_TYPES = new Set(["library", "course"]);
export const VALID_PLATFORMS = new Set(["bunny", "vimeo", "youtube"]);
export const VALID_SOURCES = new Set(["expo", "web"]);

/** Max consent events per sessionId per rolling minute (anti-spam). */
export const CONSENT_RATE_LIMIT_PER_SESSION_PER_MIN = 30;
