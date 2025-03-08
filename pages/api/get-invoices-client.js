// pages/api/get-invoices-client.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { owner_uid } = req.query;

    try {
      const invoices = await stripe.invoices.list({ limit: 100 });

      // Filtrează facturile în funcție de owner_uid
      const filteredInvoices = invoices.data.filter(
        (invoice) => invoice.metadata.owner_uid === owner_uid
      );

      res.status(200).json({ invoices: filteredInvoices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");
  }
}
