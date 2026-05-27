import { loadVideoCategories } from "../../../lib/mobilePublicData";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

  try {
    const categories = await loadVideoCategories();
    return res.status(200).json({ categories });
  } catch (error) {
    console.error("[mobile.video-categories] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load video categories", categories: [] });
  }
}
