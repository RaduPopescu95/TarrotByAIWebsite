import { loadBillingAddressDataset } from "../../../utils/billingAddressData.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const dataset = await loadBillingAddressDataset();
    return res.status(200).json(dataset);
  } catch (error) {
    console.error("[billing.address-options] load_failed", {
      message: error?.message || "unknown_error",
    });
    return res.status(500).json({ error: "Unable to load billing address options" });
  }
}
