// pages/api/get-invoices.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Preluare lista de facturi din Stripe
      const invoices = await stripe.invoices.list({
        limit: 100, // Poți ajusta limita în funcție de câte facturi dorești să returnezi
      });

      res.status(200).json({ invoices: invoices.data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");
  }
}
