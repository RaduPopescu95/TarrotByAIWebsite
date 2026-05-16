import { isSubscriptionSystemEnabled } from "../../../lib/globalSettings";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const subscriptionSystemEnabled = await isSubscriptionSystemEnabled();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ subscriptionSystemEnabled });
  } catch (e) {
    console.error("[premium.public-config]", e?.message || e);
    return res.status(500).json({ error: "Failed to load config" });
  }
}
