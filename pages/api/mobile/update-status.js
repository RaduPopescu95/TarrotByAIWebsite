import { loadMobileUpdateStatus } from "../../../lib/mobileUpdatePromptSettings";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const status = await loadMobileUpdateStatus();

    // Safety normalization: force implies show.
    const normalizedShow = Boolean(status.update || status.forceUpdate);
    const normalizedForce = Boolean(status.forceUpdate);

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
      source: "firestore:ShouldUpdate/unicde",
    });
  } catch (error) {
    console.error("[mobile/update-status] GET error", error?.message || error);
    return res.status(500).json({ error: "Failed to read update status" });
  }
}
