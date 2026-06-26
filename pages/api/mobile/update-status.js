import {
  loadMobileUpdateStatus,
  normalizeMobilePlatform,
  resolveMobileUpdatePrompt,
} from "../../../lib/mobileUpdatePromptSettings";

function readSingleQueryValue(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return typeof value === "string" ? value : "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const status = await loadMobileUpdateStatus({ bypassCache: true });
    const platform = normalizeMobilePlatform(readSingleQueryValue(req.query?.platform));
    const appVersion = readSingleQueryValue(req.query?.appVersion).trim() || null;

    const resolved = resolveMobileUpdatePrompt({
      update: status.update,
      forceUpdate: status.forceUpdate,
      minAppVersionIos: status.minAppVersionIos,
      minAppVersionAndroid: status.minAppVersionAndroid,
      platform,
      appVersion,
    });

    const normalizedShow = resolved.showUpdatePrompt;
    const normalizedForce = resolved.forceUpdate;

    res.setHeader("Cache-Control", "private, no-store, max-age=0");

    return res.status(200).json({
      showUpdatePrompt: normalizedShow,
      forceUpdate: normalizedForce,
      minAppVersionIos: status.minAppVersionIos,
      minAppVersionAndroid: status.minAppVersionAndroid,
      platform,
      appVersion,
      source: "firestore:ShouldUpdate/unicde",
    });
  } catch (error) {
    console.error("[mobile/update-status] GET error", error?.message || error);
    return res.status(500).json({ error: "Failed to read update status" });
  }
}
