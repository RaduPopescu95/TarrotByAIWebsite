// pages/api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export default async (req, res) => {
  if (req.method === 'POST') {
    const { costConsultatie, nume, email, alteInformatii, telefon, categorie, tipConsultatie, selectedSlot } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'ron',
              product_data: {
                name: `Consultatie pentru ${nume}`,
              },
              unit_amount: costConsultatie, // Prețul în bani (de exemplu: 10000 bani pentru 100 RON)
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        metadata: {
          nume,
          alteInformatii,
          telefon,
          categorie: JSON.stringify(categorie), // Transmite categoria ca string
          tipConsultatie,
          selectedSlot: JSON.stringify(selectedSlot), // Transmite selectedSlot ca string
        },
        success_url: `${req.headers.origin}/rezervare-finalizata?session_id={CHECKOUT_SESSION_ID}`, // Transmite session_id ca parametru de query
        cancel_url: `${req.headers.origin}/rezervare-anulata`,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
