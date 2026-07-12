import { getGlobalSettings, updateGlobalSettings } from "../../../lib/globalSettings";
import {
  loadMobileUpdateStatus,
  setMobileForceUpdateEnabled,
  setMobileMinAppVersions,
  setMobileUpdatePromptEnabled,
  validateForceUpdateMinVersions,
} from "../../../lib/mobileUpdatePromptSettings";

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";

async function mergeSettingsForResponse() {
  const [global, mobileStatus] = await Promise.all([
    getGlobalSettings(),
    loadMobileUpdateStatus(),
  ]);
  return {
    ...global,
    mobileUpdatePromptEnabled: mobileStatus.update,
    mobileForceUpdateEnabled: mobileStatus.forceUpdate,
    mobileMinAppVersionIos: mobileStatus.minAppVersionIos,
    mobileMinAppVersionAndroid: mobileStatus.minAppVersionAndroid,
  };
}

export default async function handler(req, res) {
  const token = req.headers["x-dashboard-token"] || "";
  if (token !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const settings = await mergeSettingsForResponse();
      return res.status(200).json({ settings });
    } catch (err) {
      console.error("[dashboard/settings] GET error", err?.message || err);
      return res.status(500).json({ error: "Failed to load settings" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const subscriptionUpdate =
        typeof body.subscriptionSystemEnabled === "boolean"
          ? body.subscriptionSystemEnabled
          : undefined;
      const billingProviderUpdates = {};
      [
        "androidBillingPremiumProvider",
        "androidBillingAnalysesProvider",
      ].forEach((key) => {
        if (body[key] === "stripe" || body[key] === "revenuecat") {
          billingProviderUpdates[key] = body[key];
        }
      });
      const mobilePromptUpdate =
        typeof body.mobileUpdatePromptEnabled === "boolean"
          ? body.mobileUpdatePromptEnabled
          : undefined;
      const mobileForceUpdate =
        typeof body.mobileForceUpdateEnabled === "boolean"
          ? body.mobileForceUpdateEnabled
          : undefined;
      const mobileMinIosProvided = Object.prototype.hasOwnProperty.call(
        body,
        "mobileMinAppVersionIos"
      );
      const mobileMinAndroidProvided = Object.prototype.hasOwnProperty.call(
        body,
        "mobileMinAppVersionAndroid"
      );

      if (
        subscriptionUpdate === undefined &&
        Object.keys(billingProviderUpdates).length === 0 &&
        mobilePromptUpdate === undefined &&
        mobileForceUpdate === undefined &&
        !mobileMinIosProvided &&
        !mobileMinAndroidProvided
      ) {
        return res.status(400).json({ error: "No valid settings to update" });
      }

      const currentMobileStatus = await loadMobileUpdateStatus({ bypassCache: true });
      const nextForceEnabled =
        mobileForceUpdate !== undefined
          ? mobileForceUpdate
          : currentMobileStatus.forceUpdate;
      const nextMinIos = mobileMinIosProvided
        ? body.mobileMinAppVersionIos
        : currentMobileStatus.minAppVersionIos;
      const nextMinAndroid = mobileMinAndroidProvided
        ? body.mobileMinAppVersionAndroid
        : currentMobileStatus.minAppVersionAndroid;

      const validation = validateForceUpdateMinVersions({
        forceUpdateEnabled: nextForceEnabled,
        minAppVersionIos: nextMinIos,
        minAppVersionAndroid: nextMinAndroid,
      });
      if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
      }

      if (subscriptionUpdate !== undefined) {
        await updateGlobalSettings(
          { subscriptionSystemEnabled: subscriptionUpdate },
          "dashboard"
        );
      }
      if (Object.keys(billingProviderUpdates).length > 0) {
        await updateGlobalSettings(billingProviderUpdates, "dashboard");
      }
      if (mobileMinIosProvided || mobileMinAndroidProvided) {
        await setMobileMinAppVersions(
          {
            ...(mobileMinIosProvided ? { ios: body.mobileMinAppVersionIos } : {}),
            ...(mobileMinAndroidProvided
              ? { android: body.mobileMinAppVersionAndroid }
              : {}),
          },
          "dashboard"
        );
      }
      if (mobilePromptUpdate !== undefined) {
        await setMobileUpdatePromptEnabled(mobilePromptUpdate, "dashboard");
      }
      if (mobileForceUpdate !== undefined) {
        await setMobileForceUpdateEnabled(mobileForceUpdate, "dashboard");
      }

      const settings = await mergeSettingsForResponse();

      return res.status(200).json({ ok: true, settings });
    } catch (err) {
      if (err?.message === "invalid_min_app_version_ios") {
        return res.status(400).json({
          error: "Versiunea minimă iOS este invalidă. Folosește un număr întreg (ex. 4).",
        });
      }
      if (err?.message === "invalid_min_app_version_android") {
        return res.status(400).json({
          error: "Versiunea minimă Android este invalidă. Folosește un număr întreg (ex. 4).",
        });
      }
      console.error("[dashboard/settings] POST error", err?.message || err);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
