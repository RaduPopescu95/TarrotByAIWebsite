// pages/api/get-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export default async (req, res) => {
  if (req.method === 'GET') {
    const { session_id } = req.query;

    try {
      // Obține detaliile sesiunii pe baza session_id
      const session = await stripe.checkout.sessions.retrieve(session_id);

      res.status(200).json(session);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve session details' });
    }
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
};
