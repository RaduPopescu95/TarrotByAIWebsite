import { readSingleQueryValue } from "../../../lib/courses";
import { loadPositiveAffirmations } from "../../../lib/mobilePublicData";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

  try {
    const items = await loadPositiveAffirmations({
      limit: readSingleQueryValue(req.query.limit),
    });
    return res.status(200).json({ items });
  } catch (error) {
    console.error("[mobile.positive-affirmations] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load affirmations", items: [] });
  }
}
