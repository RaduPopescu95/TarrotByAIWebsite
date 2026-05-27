import { readSingleQueryValue } from "../../../lib/courses";
import { loadVarianteCarti } from "../../../lib/mobilePublicData";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

  try {
    const arr = await loadVarianteCarti({
      carte: readSingleQueryValue(req.query.carte),
      categorie: readSingleQueryValue(req.query.categorie),
    });
    return res.status(200).json({ arr });
  } catch (error) {
    console.error("[mobile.variante-carti] failed", error?.message || error);
    return res.status(500).json({ error: "Failed to load VarianteCarti", arr: [] });
  }
}
