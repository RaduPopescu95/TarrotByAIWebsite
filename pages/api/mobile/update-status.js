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
    const status = await loadMobileUpdateStatus();
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

    if (normalizedForce) {
      res.setHeader("Cache-Control", "public, max-age=60");
    } else if (normalizedShow) {
      res.setHeader("Cache-Control", "public, max-age=120");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    }

    return res.status(200).json({
      showUpdatePrompt: normalizedShow,
      forceUpdate: normalizedForce,
      minAppVersionIos: status.minAppVersionIos,
      minAppVersionAndroid: status.minAppVersionAndroid,
      source: "firestore:ShouldUpdate/unicde",
    });
  } catch (error) {
    console.error("[mobile/update-status] GET error", error?.message || error);
    return res.status(500).json({ error: "Failed to read update status" });
  }
}
