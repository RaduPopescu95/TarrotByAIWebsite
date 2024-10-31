import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  let event;
  try {
    // Pregătim bufferul și semnătura pentru verificarea webhook-ului
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    // Construim evenimentul și îl validăm cu secretul de webhook
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_METADATA_INVOICES_TEST
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestionăm evenimentul `invoice.created`
  if (event.type === "invoice.created") {
    const invoice = event.data.object;

    try {
      // Verificăm dacă invoice.subscription există
      if (invoice.subscription) {
        const session = await stripe.checkout.sessions.retrieve(
          invoice.subscription
        );

        // Actualizăm metadata în factură doar dacă metadatele există
        if (session.metadata) {
          await stripe.invoices.update(invoice.id, {
            metadata: {
              nume: session.metadata.nume || "",
              alteInformatii: session.metadata.alteInformatii || "",
              telefon: session.metadata.telefon || "",
              categorie: session.metadata.categorie || "",
              tipConsultatie: session.metadata.tipConsultatie || "",
              selectedSlot: session.metadata.selectedSlot || "",
              owner_uid: session.metadata.owner_uid || "",
            },
          });
        }
      }
    } catch (err) {
      console.error("Error updating invoice metadata:", err.message);
      return res.status(500).send("Failed to update invoice metadata.");
    }
  }

  // Răspundem cu un status 200 dacă evenimentul a fost procesat cu succes
  res.status(200).send("Received and processed event.");
}
