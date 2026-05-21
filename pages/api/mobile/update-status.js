import {
  getMobileForceUpdateEnabled,
  getMobileUpdatePromptEnabled,
} from "../../../lib/mobileUpdatePromptSettings";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const showUpdatePrompt = await getMobileUpdatePromptEnabled();
    const forceUpdate = await getMobileForceUpdateEnabled();

    // Safety normalization: force implies show.
    const normalizedShow = Boolean(showUpdatePrompt || forceUpdate);
    const normalizedForce = Boolean(forceUpdate);

    res.setHeader("Cache-Control", "no-store, max-age=0");
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
