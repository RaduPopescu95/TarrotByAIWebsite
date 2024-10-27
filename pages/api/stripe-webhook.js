// pages/api/stripe-webhook.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_METADATA_INVOICES_TEST
      );

      // Verificăm dacă evenimentul este de tip `invoice.created`
      if (event.type === "invoice.created") {
        const invoice = event.data.object;

        // Recuperăm sesiunea de checkout asociată facturii
        const session = await stripe.checkout.sessions.retrieve(
          invoice.subscription || invoice.subscription
        );

        // Adăugăm metadatele la factura creată
        await stripe.invoices.update(invoice.id, {
          metadata: {
            nume: session.metadata.nume,
            alteInformatii: session.metadata.alteInformatii,
            telefon: session.metadata.telefon,
            categorie: session.metadata.categorie,
            tipConsultatie: session.metadata.tipConsultatie,
            selectedSlot: session.metadata.selectedSlot,
            owner_uid: session.metadata.owner_uid,
          },
        });
      }

      res.status(200).send("Received and processed event.");
    } catch (error) {
      console.error("Webhook error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
