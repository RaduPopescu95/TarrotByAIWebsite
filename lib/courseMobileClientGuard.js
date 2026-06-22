import {
  compareAppVersions,
  loadMobileUpdateStatus,
  normalizeAppVersion,
  normalizeMobilePlatform,
} from "./mobileUpdatePromptSettings";

function readHeader(req, name) {
  const raw = req?.headers?.[name];
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) {
    return raw[0].trim();
  }
  return null;
}

function readQuery(req, name) {
  const raw = req?.query?.[name];
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) {
    return raw[0].trim();
  }
  return null;
}

/**
 * Reads optional mobile client metadata sent by the Expo app.
 * Web clients typically omit these headers and are not version-gated here.
 */
export function readMobileClientFromRequest(req) {
  const platform = normalizeMobilePlatform(
    readHeader(req, "x-app-platform") || readQuery(req, "platform")
  );
  const appVersion = normalizeAppVersion(
    readHeader(req, "x-app-version") || readQuery(req, "appVersion")
  );
  const clientId = readHeader(req, "x-app-client") || readQuery(req, "client");
  const isExpoMobile = clientId === "expo-mobile";

  return {
    platform,
    appVersion,
    clientId,
    isExpoMobile,
    isMobilePlatform: platform === "ios" || platform === "android",
  };
}

/**
 * Blocks legacy Expo mobile builds on course media endpoints when force update
 * is enabled in ShouldUpdate/unicde. Entitlement checks remain the primary gate;
 * this adds a server-side backstop for old iOS builds that bypassed purchase UI.
 *
 * @returns {Promise<{ status: number; body: Record<string, unknown> } | null>}
 */
export async function resolveCourseMediaClientBlock(req) {
  const client = readMobileClientFromRequest(req);
  if (!client.isMobilePlatform && !client.isExpoMobile) {
    return null;
  }

  const status = await loadMobileUpdateStatus();
  if (status.forceUpdate !== true) {
    return null;
  }

  const minVersion =
    client.platform === "android"
      ? status.minAppVersionAndroid
      : status.minAppVersionIos;

  if (!minVersion) {
    return null;
  }

  if (!client.appVersion || compareAppVersions(client.appVersion, minVersion) < 0) {
    return {
      status: 403,
      body: {
        error: "app_update_required",
        message: "Please update the app to access purchased course content.",
        minAppVersion: minVersion,
        platform: client.platform || null,
      },
    };
  }

  return null;
}
