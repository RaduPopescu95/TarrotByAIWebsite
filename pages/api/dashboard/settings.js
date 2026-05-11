import { getGlobalSettings, updateGlobalSettings } from "../../../lib/globalSettings";

const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET || "Cristina1994!";

export default async function handler(req, res) {
  const token = req.headers["x-dashboard-token"] || "";
  if (token !== DASHBOARD_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const settings = await getGlobalSettings();
      return res.status(200).json({ settings });
    } catch (err) {
      console.error("[dashboard/settings] GET error", err?.message || err);
      return res.status(500).json({ error: "Failed to load settings" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const updates = {};

      if (typeof body.subscriptionSystemEnabled === "boolean") {
        updates.subscriptionSystemEnabled = body.subscriptionSystemEnabled;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid settings to update" });
      }

      await updateGlobalSettings(updates, "dashboard");
      const settings = await getGlobalSettings();

      return res.status(200).json({ ok: true, settings });
    } catch (err) {
      console.error("[dashboard/settings] POST error", err?.message || err);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
