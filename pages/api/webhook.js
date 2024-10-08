// pages/api/webhook.js
import { buffer } from "micro";
import Stripe from "stripe";
import { handleUploadFirestoreGeneral } from "../../utils/firestoreUtils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

// Dezactivăm parserul de corp implicit al API-ului Next.js pentru a putea utiliza buffer-ul
export const config = {
  api: {
    bodyParser: false,
  },
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_TEST;

export default async (req, res) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // Verifică semnătura webhook-ului Stripe pentru a asigura autenticitatea
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
      console.error(
        `⚠️  Webhook signature verification failed: ${err.message}`
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestionează tipul de eveniment primit de la Stripe
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        // Acțiunea dorită în funcție de datele sesiunii completate
        console.log("Sesiune completată:", session);

        // Extrage datele din metadata pentru a le folosi mai departe
        const rezervareData = {
          nume: session.metadata.nume,
          alteInformatii: session.metadata.alteInformatii,
          email: session.customer_email,
          telefon: session.metadata.telefon,
          categorie: JSON.parse(session.metadata.categorie),
          tipConsultatie: session.metadata.tipConsultatie,
          selectedSlot: JSON.parse(session.metadata.selectedSlot),
          costConsultatie: session.amount_total / 100, // Stripe stochează sumele în bani
        };

        // Încarcă datele în Firestore folosind funcția `handleUploadFirestoreGeneral`
        await handleUploadFirestoreGeneral(
          rezervareData,
          "RezervariConsultatii"
        );
        console.log("Rezervarea a fost salvată în Firestore.");
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Returnează un răspuns 200 pentru a indica faptul că evenimentul a fost procesat corect
    res.status(200).send("Success");
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
