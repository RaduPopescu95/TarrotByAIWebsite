import { getVatPercentage } from "../../../lib/globalSettings";

/**
 * Minimal public endpoint so client-rendered pages can show VAT-inclusive
 * prices without embedding the rate in the bundle.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const vatPercentage = await getVatPercentage();
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ vatPercentage, pricesIncludeVat: true });
}
