import Stripe from 'stripe';
import { handleUploadFirestoreGeneral, handleUpdateFirestore } from '../../utils/firestoreUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      conferintaId,
      conferintaTitlu,
      participantData,
      pretParticipare,
      userId,
      uniqueAccessLink,
      tipConferinta,
      dataInceput,
      dataFinal,
      oraInceput,
      oraFinal
    } = req.body;

    // Validare date
    if (!conferintaId || !participantData || !pretParticipare || !userId) {
      return res.status(400).json({ error: 'Date lipsă pentru procesarea plății' });
    }

    // Creează Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ron',
            product_data: {
              name: conferintaTitlu,
              description: `${tipConferinta === 'course' ? 'Curs' : 'Conferință'} - ${dataInceput}${dataFinal ? ` → ${dataFinal}` : ''}, ${oraInceput}${oraFinal ? ` - ${oraFinal}` : ''}`,
              images: [], // Poți adăuga imagini aici dacă vrei
            },
            unit_amount: Math.round(pretParticipare * 100), // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success-conferinta-grup?session_id={CHECKOUT_SESSION_ID}&conferinta_id=${conferintaId}`,
      cancel_url: `${req.headers.origin}/calendar-conferinte-grup`,
      customer_email: participantData.email,
      // Configurez colectarea adresei de facturare
      billing_address_collection: 'required',
      // Pre-populez adresa de facturare cu datele colectate
      customer_details: {
        address: {
          line1: participantData.adresa,
          city: participantData.oras,
          state: participantData.judet,
          postal_code: participantData.codPostal,
          country: 'RO' // România
        }
      },
      metadata: {
        conferintaId: conferintaId,
        userId: userId,
        uniqueAccessLink: uniqueAccessLink,
        participantName: `${participantData.prenume} ${participantData.nume}`,
        participantEmail: participantData.email,
        participantPhone: participantData.telefon,
        observatii: participantData.observatii || '',
        tipConferinta: tipConferinta,
        // Adresa de facturare
        adresa: participantData.adresa || '',
        oras: participantData.oras || '',
        judet: participantData.judet || '',
        codPostal: participantData.codPostal || '',
        tara: participantData.tara || 'România'
      },
    });

    // Salvez informațiile despre sesiunea de plată în Firestore pentru tracking
    const paymentSession = {
      stripeSessionId: session.id,
      conferintaId: conferintaId,
      userId: userId,
      participantData: participantData,
      uniqueAccessLink: uniqueAccessLink,
      pretParticipare: pretParticipare,
      status: 'pending',
      createdAt: new Date().toISOString(),
      conferintaDetails: {
        titlu: conferintaTitlu,
        tipConferinta: tipConferinta,
        dataInceput: dataInceput,
        dataFinal: dataFinal,
        oraInceput: oraInceput,
        oraFinal: oraFinal
      }
    };

    await handleUploadFirestoreGeneral(paymentSession, 'PlatiConferinteGrup');

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 