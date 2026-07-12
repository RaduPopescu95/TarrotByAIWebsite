import { getPublicBillingConfig } from "../../../lib/billingConfig";
import { getGlobalSettings } from "../../../lib/globalSettings";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getGlobalSettings();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      ...getPublicBillingConfig(settings),
      subscriptionSystemEnabled: settings.subscriptionSystemEnabled,
    });
  } catch (error) {
    console.error("[billing.config] load_failed", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Failed to load billing config" });
  }
}
