import { getGlobalSettings, updateGlobalSettings } from "../../../lib/globalSettings";
import {
  getMobileUpdatePromptEnabled,
  setMobileUpdatePromptEnabled,
} from "../../../lib/mobileUpdatePromptSettings";

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";

async function mergeSettingsForResponse() {
  const global = await getGlobalSettings();
  const mobileUpdatePromptEnabled = await getMobileUpdatePromptEnabled();
  return {
    ...global,
    mobileUpdatePromptEnabled,
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
      const mobilePromptUpdate =
        typeof body.mobileUpdatePromptEnabled === "boolean"
          ? body.mobileUpdatePromptEnabled
          : undefined;

      if (subscriptionUpdate === undefined && mobilePromptUpdate === undefined) {
        return res.status(400).json({ error: "No valid settings to update" });
      }

      if (subscriptionUpdate !== undefined) {
        await updateGlobalSettings(
          { subscriptionSystemEnabled: subscriptionUpdate },
          "dashboard"
        );
      }
      if (mobilePromptUpdate !== undefined) {
        await setMobileUpdatePromptEnabled(mobilePromptUpdate, "dashboard");
      }

      const settings = await mergeSettingsForResponse();

      return res.status(200).json({ ok: true, settings });
    } catch (err) {
      console.error("[dashboard/settings] POST error", err?.message || err);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
