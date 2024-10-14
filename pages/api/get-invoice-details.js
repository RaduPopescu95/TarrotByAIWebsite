// pages/api/get-invoice-details.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { invoiceId } = req.query;

    try {
      // Preia factura specifică folosind ID-ul facturii din Stripe
      const invoice = await stripe.invoices.retrieve(invoiceId);

      // Trimite detaliile facturii înapoi către client (inclusiv timestamp-ul `created`)
      res.status(200).json({ created: invoice.created });
    } catch (error) {
      console.error("Eroare la preluarea detaliilor facturii:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");
  }
}
