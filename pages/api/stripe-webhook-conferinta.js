import { buffer } from "micro";
import Stripe from 'stripe';
import { handleUpdateFirestore, handleUploadFirestoreGeneral } from '../../utils/firestoreUtils';
import { createOlbioInvoice } from '../../utils/olbioClient';
import { getAdminDb } from "../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_CONFERINTA;

const adminDb = getAdminDb();

export default async function handler(req, res) {
  const requestId = `WH_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  console.log(`🔔 [${requestId}] ========== WEBHOOK STRIPE ÎNCEPUT ==========`);
  console.log(`🔔 [${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`🔔 [${requestId}] Method: ${req.method}`);
  console.log(`🔔 [${requestId}] Headers present: ${Object.keys(req.headers).join(', ')}`);
  
  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  console.log(`🔔 [${requestId}] Stripe signature present: ${!!sig}`);
  console.log(`🔔 [${requestId}] Endpoint secret configured: ${!!endpointSecret}`);
  
  let event;

  try {
    console.log(`🔔 [${requestId}] Începe citirea raw body...`);
    const buf = await buffer(req);
    console.log(`🔔 [${requestId}] Raw body length: ${buf.length} bytes`);
    
    console.log(`🔔 [${requestId}] Începe validarea semnăturii Stripe...`);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    console.log(`✅ [${requestId}] Semnătura Stripe validată cu succes`);
    console.log(`🔔 [${requestId}] Event type: ${event.type}`);
    console.log(`🔔 [${requestId}] Event ID: ${event.id}`);
    console.log(`🔔 [${requestId}] Event created: ${new Date(event.created * 1000).toISOString()}`);
  } catch (err) {
    console.error(`💥 [${requestId}] Webhook signature verification failed:`, err.message);
    console.error(`💥 [${requestId}] Error stack:`, err.stack);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`🔔 [${requestId}] Procesez event type: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`💳 [${requestId}] Procesez checkout.session.completed`);
        const session = event.data.object;
        console.log(`💳 [${requestId}] Session ID: ${session.id}`);
        console.log(`💳 [${requestId}] Session amount: ${session.amount_total / 100} RON`);
        console.log(`💳 [${requestId}] Session status: ${session.status}`);
        console.log(`💳 [${requestId}] Payment status: ${session.payment_status}`);
        
        // 🔍 Verifică că este plată pentru conferință
        const isConferencePayment = session.metadata?.conferintaId || session.metadata?.tipConferinta;
        
        if (!isConferencePayment) {
          console.log(`⚠️ [${requestId}] Plată pentru CONSULTAȚIE INDIVIDUALĂ detectată - redirect către webhook consultații`);
          console.log(`⚠️ [${requestId}] Metadata consultație:`, {
            nume: session.metadata?.nume,
            tipConsultatie: session.metadata?.tipConsultatie,
            categorie: session.metadata?.categorie ? 'present' : 'absent'
          });
          console.log(`⚠️ [${requestId}] Acest webhook procesează DOAR conferințe de grup`);
          break; // Skip processing pentru consultații
        }

        console.log(`✅ [${requestId}] Plată pentru CONFERINȚĂ confirmată`);
        console.log(`✅ [${requestId}] ConferințaID: ${session.metadata?.conferintaId}`);
        
        await handleSuccessfulPayment(session, requestId);
        console.log(`✅ [${requestId}] Checkout session procesat cu succes`);
        break;
        
      case 'payment_intent.succeeded':
        console.log(`💳 [${requestId}] Procesez payment_intent.succeeded`);
        const paymentIntent = event.data.object;
        console.log(`💳 [${requestId}] Payment Intent ID: ${paymentIntent.id}`);
        console.log(`💳 [${requestId}] Payment Intent amount: ${paymentIntent.amount / 100} RON`);
        console.log(`💳 [${requestId}] Payment Intent status: ${paymentIntent.status}`);
        break;
        
      default:
        console.log(`⚠️ [${requestId}] Unhandled event type: ${event.type}`);
        console.log(`⚠️ [${requestId}] Event data:`, JSON.stringify(event.data, null, 2));
    }
    
    console.log(`✅ [${requestId}] Event procesat cu succes`);
  } catch (error) {
    console.error(`💥 [${requestId}] Eroare la procesarea event-ului:`, error.message);
    console.error(`💥 [${requestId}] Error stack:`, error.stack);
    console.error(`💥 [${requestId}] Event data:`, JSON.stringify(event.data, null, 2));
    
    // Nu returnam eroare pentru a nu bloca webhook-ul
    console.log(`⚠️ [${requestId}] Continuă cu răspuns 200 pentru a nu bloca webhook-ul`);
  }

  console.log(`🔔 [${requestId}] ========== WEBHOOK STRIPE FINAL ==========`);
  res.status(200).json({ received: true, requestId });
}

async function handleSuccessfulPayment(session, requestId) {
  const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    console.log(`💳 [${requestId}] [${paymentId}] ========== PROCESARE PLATĂ ÎNCEPUT ==========`);
    console.log(`💳 [${requestId}] [${paymentId}] Session ID: ${session.id}`);
    console.log(`💳 [${requestId}] [${paymentId}] Amount paid: ${session.amount_total / 100} RON`);
    console.log(`💳 [${requestId}] [${paymentId}] Payment status: ${session.payment_status}`);
    console.log(`💳 [${requestId}] [${paymentId}] Customer email: ${session.customer_details?.email}`);

    // Verifică dacă metadata există
    if (!session.metadata) {
      console.error(`💥 [${requestId}] [${paymentId}] CRITICĂ: Session metadata lipsește complet!`);
      console.error(`💥 [${requestId}] [${paymentId}] Session object keys:`, Object.keys(session));
      return;
    }

    console.log(`💳 [${requestId}] [${paymentId}] Metadata primit:`, JSON.stringify(session.metadata, null, 2));

    const {
      conferintaId,
      userId,
      uniqueAccessLink,
      participantName,
      participantEmail,
      participantPhone,
      observatii,
      tipConferinta
    } = session.metadata;

    // Validări detaliate metadata
    const validationErrors = [];
    if (!conferintaId) validationErrors.push('conferintaId lipsește');
    if (!userId) validationErrors.push('userId lipsește');
    if (!uniqueAccessLink) validationErrors.push('uniqueAccessLink lipsește');
    if (!participantName) validationErrors.push('participantName lipsește');
    if (!participantEmail) validationErrors.push('participantEmail lipsește');
    
    if (validationErrors.length > 0) {
      console.error(`💥 [${requestId}] [${paymentId}] CRITICĂ: Date lipsă în metadata:`, validationErrors);
      console.error(`💥 [${requestId}] [${paymentId}] Metadata complet:`, session.metadata);
      return;
    }

    console.log(`✅ [${requestId}] [${paymentId}] Validarea metadata trecută cu succes`);
    console.log(`💳 [${requestId}] [${paymentId}] ConferintaID: ${conferintaId}`);
    console.log(`💳 [${requestId}] [${paymentId}] UserID: ${userId}`);
    console.log(`💳 [${requestId}] [${paymentId}] Access Link: ${uniqueAccessLink}`);
    console.log(`💳 [${requestId}] [${paymentId}] Participant: ${participantName} (${participantEmail})`);

    // 1. Actualizez sesiunea de plată în Firestore (dacă există)
    console.log(`💳 [${requestId}] [${paymentId}] Verifică sesiunea de plată existentă...`);
    let paymentSession = null;
    try {
      const paymentSnapshot = await adminDb
        .collection('PlatiConferinteGrup')
        .where('stripeSessionId', '==', session.id)
        .limit(1)
        .get();

      paymentSession = paymentSnapshot.empty
        ? null
        : {
            documentId: paymentSnapshot.docs[0].id,
            ...paymentSnapshot.docs[0].data(),
          };
      
      if (paymentSession) {
        console.log(`💳 [${requestId}] [${paymentId}] Sesiune de plată găsită, actualizez...`);
        await handleUpdateFirestore(
          `PlatiConferinteGrup/${paymentSession.documentId}`,
          {
            ...paymentSession,
            status: 'completed',
            completedAt: new Date().toISOString(),
            stripePaymentId: session.payment_intent,
            webhookProcessedAt: new Date().toISOString(),
            requestId: requestId,
            paymentId: paymentId
          }
        );
        console.log(`✅ [${requestId}] [${paymentId}] Sesiunea de plată actualizată cu succes`);
      } else {
        console.log(`⚠️ [${requestId}] [${paymentId}] Sesiunea de plată nu a fost găsită în Firestore`);
        console.log(`⚠️ [${requestId}] [${paymentId}] Session ID căutat: ${session.id}`);
      }
    } catch (paymentUpdateError) {
      console.error(`💥 [${requestId}] [${paymentId}] Eroare la actualizarea sesiunii:`, paymentUpdateError.message);
      // Continuă procesul chiar dacă actualizarea sesiunii eșuează
    }

    // 2. Încarcă direct conferința din Firestore
    console.log(`💳 [${requestId}] [${paymentId}] Încarcă direct conferința din Firestore...`);
    const conferintaSnapshot = await adminDb.collection('ConferinteGrup').doc(conferintaId).get();
    const conferinta = conferintaSnapshot.exists
      ? {
          documentId: conferintaSnapshot.id,
          ...conferintaSnapshot.data(),
        }
      : null;
    
    if (!conferinta) {
      console.error(`💥 [${requestId}] [${paymentId}] CRITICĂ: Conferința nu a fost găsită!`);
      console.error(`💥 [${requestId}] [${paymentId}] ConferintaID căutat: ${conferintaId}`);
      return;
    }

    console.log(`✅ [${requestId}] [${paymentId}] Conferința găsită: "${conferinta.titlu}"`);
    console.log(`💳 [${requestId}] [${paymentId}] Participanți existenți: ${conferinta.participanti?.length || 0}`);
    
    // 3. Creează datele participantului
    const newParticipant = {
      userId: userId,
      nume: participantName,
      email: participantEmail,
      telefon: participantPhone,
      observatii: observatii || "",
      uniqueAccessLink: uniqueAccessLink,
      dataInscrierii: new Date().toISOString(),
      metodaPlata: "STRIPE_CARD", // Plata reală prin Stripe
      pretPlatit: session.amount_total / 100, // Amount in RON
      stripeSessionId: session.id,
      stripePaymentId: session.payment_intent,
      status: 'confirmed',
      isGuestUser: !userId.includes('@'), // Simplu check dacă nu este email, probabil este guest
      accessLink: uniqueAccessLink // Pentru compatibilitate cu structura existentă
    };
    if (paymentSession?.rawFormValues) {
      newParticipant.rawFormValues = paymentSession.rawFormValues;
      newParticipant.normalizedBeforeCheckout = paymentSession.normalizedBeforeCheckout || null;
      newParticipant.checkoutRequestPayload = paymentSession.checkoutRequestPayload || null;
      newParticipant.stripeMetadataSnapshot = paymentSession.stripeMetadataSnapshot || session.metadata || null;
      newParticipant.invoiceDecision = paymentSession.invoiceDecision || null;
    }

    console.log(`💳 [${requestId}] [${paymentId}] Date participant nou:`, JSON.stringify(newParticipant, null, 2));

    // 4. Verifică dacă participantul nu este deja înscris
    const participantiExistenti = conferinta.participanti || [];
    const isAlreadyRegistered = participantiExistenti.some(p => p && p.userId === userId);

    if (isAlreadyRegistered) {
      console.log(`⚠️ [${requestId}] [${paymentId}] Participantul este deja înscris cu userId: ${userId}`);
      console.log(`⚠️ [${requestId}] [${paymentId}] Participanți existenți:`, participantiExistenti.map(p => ({
        userId: p?.userId,
        email: p?.email,
        nume: p?.nume
      })));
      return;
    }

    // 5. Adaugă participantul la conferință
    console.log(`💳 [${requestId}] [${paymentId}] Adaugă participantul la conferință...`);
    const updatedParticipanti = [...participantiExistenti, newParticipant];
    
    try {
      await handleUpdateFirestore(
        `ConferinteGrup/${conferintaId}`,
        {
          ...conferinta,
          participanti: updatedParticipanti
        }
      );
      console.log(`✅ [${requestId}] [${paymentId}] Participant adăugat cu succes în Firestore`);
      console.log(`✅ [${requestId}] [${paymentId}] Total participanți acum: ${updatedParticipanti.length}`);
    } catch (firestoreError) {
      console.error(`💥 [${requestId}] [${paymentId}] CRITICĂ: Eroare la salvarea în Firestore:`, firestoreError.message);
      console.error(`💥 [${requestId}] [${paymentId}] Firestore error stack:`, firestoreError.stack);
      throw firestoreError;
    }

    // 6. Salvează înregistrarea plății pentru tracking (dacă nu există deja)
    console.log(`💳 [${requestId}] [${paymentId}] Salvez înregistrarea plății...`);
    try {
      const plataData = {
        conferintaId: conferintaId,
        conferintaTitlu: conferinta.titlu,
        userId: userId,
        participantData: newParticipant,
        suma: session.amount_total / 100, // Convert from cents to RON
        status: "succeeded",
        metodaPlata: "STRIPE_CARD", // Plata reală prin Stripe
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        dataPlata: new Date().toISOString(),
        accessLink: uniqueAccessLink,
        isGuestUser: !userId.includes('@'),
        webhookProcessedAt: new Date().toISOString(),
        requestId: requestId,
        paymentId: paymentId,
        rawFormValues: paymentSession?.rawFormValues || null,
        normalizedBeforeCheckout: paymentSession?.normalizedBeforeCheckout || null,
        checkoutRequestPayload: paymentSession?.checkoutRequestPayload || null,
        stripeMetadataSnapshot: paymentSession?.stripeMetadataSnapshot || session.metadata || null,
        storedBillingSnapshot: {
          metadata: session.metadata || {},
          customerDetails: session.customer_details || null,
        },
        invoiceDecision: paymentSession?.invoiceDecision || null,
      };

      await handleUploadFirestoreGeneral(plataData, "PlatiConferinteGrup");
      console.log(`✅ [${requestId}] [${paymentId}] Înregistrarea plății salvată în PlatiConferinteGrup`);
    } catch (paymentError) {
      console.error(`💥 [${requestId}] [${paymentId}] Eroare la salvarea plății:`, paymentError.message);
      console.error(`💥 [${requestId}] [${paymentId}] Payment error stack:`, paymentError.stack);
      // Nu opresc procesul pentru această eroare
    }

    // 6.1. Creează factura în Olbio (fail-safe)
    try {
      console.log(`🧾 [${requestId}] [${paymentId}] Creez factură în Olbio (conferinta)...`);
      const invoice = await createOlbioInvoice({
        type: "conferinta",
        rezervareData: null,
        session,
        conferinta,
        participant: newParticipant
      });
      if (invoice?.audit && paymentSession?.documentId) {
        await handleUpdateFirestore(
          `PlatiConferinteGrup/${paymentSession?.documentId || ""}`,
          {
            finalOblioPayload: invoice.audit.finalOblioPayload || null,
            oblioResponse: invoice.audit.oblioResponse || invoice || null,
            invoiceDecision: invoice.audit.invoiceDecision || paymentSession?.invoiceDecision || null,
          }
        );
      }
      if (invoice?.id || invoice?.documentId) {
        console.log(`🧾 [${requestId}] [${paymentId}] Factură creată cu succes în Olbio`, invoice?.id || invoice?.documentId);
      } else {
        console.log(`🧾 [${requestId}] [${paymentId}] Factură Olbio nu a returnat ID (verifică logs/config).`);
      }
    } catch (olbioErr) {
      console.error(`💥 [${requestId}] [${paymentId}] Eroare creare factură Olbio:`, olbioErr?.message || olbioErr);
    }

    // 7. Trimit email de confirmare cu link-ul de acces
    console.log(`💳 [${requestId}] [${paymentId}] Începe trimiterea emailului...`);
    try {
      await sendConfirmationEmail({
        participantEmail: participantEmail,
        participantName: participantName,
        conferinta: conferinta,
        uniqueAccessLink: uniqueAccessLink,
        tipConferinta: tipConferinta,
        requestId: requestId,
        paymentId: paymentId
      });
      console.log(`✅ [${requestId}] [${paymentId}] Email trimis cu succes`);
    } catch (emailError) {
      console.error(`💥 [${requestId}] [${paymentId}] Eroare la trimiterea emailului:`, emailError.message);
      console.error(`💥 [${requestId}] [${paymentId}] Email error stack:`, emailError.stack);
      // Nu opresc procesul pentru această eroare
    }

    console.log(`✅ [${requestId}] [${paymentId}] ========== PROCESARE PLATĂ COMPLETĂ ==========`);
    console.log(`✅ [${requestId}] [${paymentId}] Procesare completă pentru: ${participantEmail}`);
    
  } catch (error) {
    console.error(`💥 [${requestId}] [${paymentId}] CRITICĂ: Eroare în handleSuccessfulPayment:`, error.message);
    console.error(`💥 [${requestId}] [${paymentId}] Error stack:`, error.stack);
    console.error(`💥 [${requestId}] [${paymentId}] Session data:`, JSON.stringify(session, null, 2));
    
    // Re-throw pentru a fi prins de handler-ul principal
    throw error;
  }
}

async function sendConfirmationEmail({ participantEmail, participantName, conferinta, uniqueAccessLink, tipConferinta, requestId, paymentId }) {
  const emailId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  try {
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] ========== TRIMITERE EMAIL ÎNCEPUT ==========`);
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Participant: ${participantName}`);
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Email: ${participantEmail}`);
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Conferință: ${conferinta.titlu}`);
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Access Link: ${uniqueAccessLink}`);

    // Formatez datele participant pentru noul API
    const participantData = {
      nume: participantName.split(' ').slice(-1)[0] || participantName, // Ultimul cuvânt ca nume
      prenume: participantName.split(' ').slice(0, -1).join(' ') || participantName, // Restul ca prenume
      email: participantEmail
    };

    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Date participant formatate:`, participantData);

    // Formatez datele conferință pentru noul API
    const conferintaData = {
      titlu: conferinta.titlu,
      descriere: conferinta.descriere,
      tipConferinta: tipConferinta,
      dataInceput: conferinta.dataInceput,
      dataFinal: conferinta.dataFinal,
      oraInceput: conferinta.oraInceput,
      oraFinal: conferinta.oraFinal,
      pretParticipare: conferinta.pretParticipare
    };

    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Date conferință formatate:`, conferintaData);

    const emailPayload = {
      participantData: participantData,
      conferintaData: conferintaData,
      accessLink: uniqueAccessLink,
      isTestMode: false // Plata reală prin Stripe
    };

    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Payload final pentru API:`, JSON.stringify(emailPayload, null, 2));

    // Determină URL-ul de bază pentru site (producție vs dezvoltare)
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://www.cristinazurba.com' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristinazurba.com');
    
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Base URL detectat: ${baseUrl}`);

    const emailApiUrl = `${baseUrl}/api/send-email-conferinta`;
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] URL API email: ${emailApiUrl}`);

    // Trimite email-ul prin noul nostru API
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Începe cererea HTTP către API...`);
    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Răspuns HTTP primit: ${response.status} ${response.statusText}`);

    const result = await response.json();
    console.log(`📧 [${requestId}] [${paymentId}] [${emailId}] Rezultat API:`, result);

    if (!response.ok) {
      console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Eroare HTTP: ${response.status}`);
      console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Eroare detalii:`, result);
      throw new Error(`Failed to send email: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ [${requestId}] [${paymentId}] [${emailId}] Email trimis cu succes!`);
    console.log(`✅ [${requestId}] [${paymentId}] [${emailId}] Message ID: ${result.messageId}`);
    console.log(`✅ [${requestId}] [${paymentId}] [${emailId}] ========== TRIMITERE EMAIL COMPLETĂ ==========`);
    
  } catch (error) {
    console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] CRITICĂ: Eroare la trimiterea emailului:`);
    console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Error message:`, error.message);
    console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Error stack:`, error.stack);
    console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Participantul:`, participantName);
    console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Email destinatar:`, participantEmail);
    console.error(`💥 [${requestId}] [${paymentId}] [${emailId}] Conferință:`, conferinta.titlu);
    
    // Re-throw pentru a fi prins de handler-ul principal
    throw error;
  }
}

// Configurare pentru raw body parsing (necesar pentru Stripe webhook)
export const config = {
  api: {
    bodyParser: false,
  },
}; 
