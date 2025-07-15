import Stripe from 'stripe';
import { handleUploadFirestoreGeneral, handleUpdateFirestore } from '../../utils/firestoreUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const checkoutId = `CHECKOUT_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  console.log(`💳 [${checkoutId}] ========== CREARE CHECKOUT SESSION ÎNCEPUT ==========`);
  console.log(`💳 [${checkoutId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`💳 [${checkoutId}] Method: ${req.method}`);
  console.log(`💳 [${checkoutId}] Origin: ${req.headers.origin}`);
  console.log(`💳 [${checkoutId}] User-Agent: ${req.headers['user-agent']}`);
  
  if (req.method !== 'POST') {
    console.log(`❌ [${checkoutId}] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`💳 [${checkoutId}] Parsez datele din request body...`);
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

    console.log(`💳 [${checkoutId}] Date primite:`, {
      conferintaId,
      conferintaTitlu,
      participantData: participantData ? {
        nume: participantData.nume,
        prenume: participantData.prenume,
        email: participantData.email,
        telefon: participantData.telefon
      } : null,
      pretParticipare,
      userId,
      uniqueAccessLink,
      tipConferinta,
      dataInceput,
      dataFinal,
      oraInceput,
      oraFinal
    });

    // Validare date
    console.log(`💳 [${checkoutId}] Validez datele primite...`);
    const validationErrors = [];
    if (!conferintaId) validationErrors.push('conferintaId lipsește');
    if (!participantData) validationErrors.push('participantData lipsește');
    if (!pretParticipare) validationErrors.push('pretParticipare lipsește');
    if (!userId) validationErrors.push('userId lipsește');
    if (!uniqueAccessLink) validationErrors.push('uniqueAccessLink lipsește');
    if (!conferintaTitlu) validationErrors.push('conferintaTitlu lipsește');
    
    if (validationErrors.length > 0) {
      console.error(`💥 [${checkoutId}] Validare eșuată:`, validationErrors);
      return res.status(400).json({ error: 'Date lipsă pentru procesarea plății', details: validationErrors });
    }

    // Validare participantData
    if (participantData) {
      const participantValidationErrors = [];
      if (!participantData.nume) participantValidationErrors.push('nume lipsește');
      if (!participantData.prenume) participantValidationErrors.push('prenume lipsește');
      if (!participantData.email) participantValidationErrors.push('email lipsește');
      if (!participantData.telefon) participantValidationErrors.push('telefon lipsește');
      
      if (participantValidationErrors.length > 0) {
        console.error(`💥 [${checkoutId}] Validare participantData eșuată:`, participantValidationErrors);
        return res.status(400).json({ error: 'Date participant incomplete', details: participantValidationErrors });
      }
    }

    console.log(`✅ [${checkoutId}] Validarea datelor a trecut cu succes`);

    // Pregătește metadata pentru Stripe
    const metadata = {
      conferintaId: conferintaId,
      userId: userId,
      uniqueAccessLink: uniqueAccessLink,
      participantName: `${participantData.prenume} ${participantData.nume}`,
      participantEmail: participantData.email,
      participantPhone: participantData.telefon,
      observatii: participantData.observatii || '',
      tipConferinta: tipConferinta
    };

    console.log(`💳 [${checkoutId}] Metadata pregătită pentru Stripe:`, metadata);

    // Creează Stripe checkout session
    console.log(`💳 [${checkoutId}] Creez Stripe checkout session...`);
    console.log(`💳 [${checkoutId}] Preț: ${pretParticipare} RON (${Math.round(pretParticipare * 100)} cents)`);
    
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
      metadata: metadata,
    });

    console.log(`✅ [${checkoutId}] Stripe checkout session creată cu succes`);
    console.log(`💳 [${checkoutId}] Session ID: ${session.id}`);
    console.log(`💳 [${checkoutId}] Session URL: ${session.url}`);
    console.log(`💳 [${checkoutId}] Session amount: ${session.amount_total / 100} RON`);

    // Salvez informațiile despre sesiunea de plată în Firestore pentru tracking
    console.log(`💳 [${checkoutId}] Salvez sesiunea în Firestore...`);
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
      },
      checkoutId: checkoutId,
      metadata: metadata
    };

    console.log(`💳 [${checkoutId}] Date sesiune pentru Firestore:`, JSON.stringify(paymentSession, null, 2));

    try {
      await handleUploadFirestoreGeneral(paymentSession, 'PlatiConferinteGrup');
      console.log(`✅ [${checkoutId}] Sesiunea salvată cu succes în Firestore`);
    } catch (firestoreError) {
      console.error(`💥 [${checkoutId}] Eroare la salvarea în Firestore:`, firestoreError.message);
      console.error(`💥 [${checkoutId}] Firestore error stack:`, firestoreError.stack);
      // Continuă procesul chiar dacă salvarea în Firestore eșuează
    }

    console.log(`✅ [${checkoutId}] ========== CREARE CHECKOUT SESSION COMPLETĂ ==========`);
    console.log(`✅ [${checkoutId}] Redirecting to Stripe checkout: ${session.url}`);

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error(`💥 [${checkoutId}] CRITICĂ: Eroare la crearea checkout session:`, error.message);
    console.error(`💥 [${checkoutId}] Error stack:`, error.stack);
    console.error(`💥 [${checkoutId}] Request body:`, JSON.stringify(req.body, null, 2));
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      checkoutId: checkoutId 
    });
  }
} 