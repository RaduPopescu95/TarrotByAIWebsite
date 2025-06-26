// pages/api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req, res) => {
  if (req.method === "POST") {
    const {
      costConsultatie,
      nume,
      email,
      alteInformatii,
      telefon,
      categorie,
      tipConsultatie,
      selectedSlot,
      owner_uid,
      adresaClient,
    } = req.body;

    try {
      console.log("Stripe session data:", { costConsultatie, nume, email });
      console.log(
        "Stripe Public Key:",
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      );
      console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

      // Creează sesiunea de checkout cu opțiunea de creare factură
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "ro", // Setează limba pentru interfața de checkout
        line_items: [
          {
            price_data: {
              currency: "ron",
              product_data: {
                name: `Consultatie pentru ${nume}`,
              },
              unit_amount: costConsultatie, // Prețul în bani (de exemplu: 10000 bani pentru 100 RON)
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        billing_address_collection: "required", // Solicită adresa de facturare
        phone_number_collection: { enabled: true }, // Solicită numărul de telefon
        metadata: {
          nume,
          alteInformatii,
          telefon,
          categorie: JSON.stringify(categorie), // Transmite categoria ca string
          tipConsultatie,
          selectedSlot: JSON.stringify(selectedSlot),
          owner_uid,
          adresaClient,
        },
        // Generez factura în Stripe (pentru Oblio) dar nu o trimit prin email
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `Plată consultație pentru ${nume}`,
            footer: "Mulțumim pentru plată!",
            // Nu setez custom_fields sau rendering_options pentru a evita trimiterea automată
          },
        },
        success_url: `${req.headers.origin}/rezervare-finalizata?session_id={CHECKOUT_SESSION_ID}`, // Transmite session_id ca parametru de query
        cancel_url: `${req.headers.origin}/calendar`,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
