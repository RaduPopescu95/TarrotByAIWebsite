// pages/api/get-invoice-pdf.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { invoiceId } = req.query;

    try {
      // Preia factura specifică folosind ID-ul facturii din Stripe
      const invoice = await stripe.invoices.retrieve(invoiceId);

      // Obține link-ul către PDF-ul facturii
      const invoicePdfUrl = invoice.invoice_pdf;

      // Trimite link-ul PDF înapoi către client
      res.status(200).json({ pdfUrl: invoicePdfUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");
  }
}
