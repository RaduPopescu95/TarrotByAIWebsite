import Stripe from 'stripe';
import { handleUploadFirestoreGeneral, handleUpdateFirestore } from '../../utils/firestoreUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function isMaintenanceEnabled() {
  return String(process.env.PAYMENTS_MAINTENANCE_ENABLED || "").toLowerCase() === "true";
}

function getMaintenanceKeyFromReq(req) {
  const q = req.query?.maintenance_key;
  if (Array.isArray(q)) return q[0] || "";
  return q || "";
}

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
    // Maintenance gate (server-side hard block)
    if (isMaintenanceEnabled()) {
      const expected = process.env.PAYMENTS_MAINTENANCE_KEY || "";
      const provided = getMaintenanceKeyFromReq(req);
      if (!expected || provided !== expected) {
        console.log(`🛠️ [${checkoutId}] Maintenance enabled - blocking checkout`);
        return res.status(503).json({
          error: "maintenance",
          message:
            "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu.",
        });
      }
      console.log(`🛠️ [${checkoutId}] Maintenance bypass accepted`);
    }

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
      oraFinal,
      // Optional buyer/company metadata for invoicing/e-Factura (passed through Stripe metadata)
      buyerType, // "company" | "person"
      buyerCif,
      buyerCnp,
      buyerCompanyName,
      buyerRegCom,
      buyerVatPayer, // boolean
      buyerStreet,
      buyerCity,
      buyerCounty,
      buyerPostalCode,
      buyerCountry,
      buyerContactName,
      buyerEmail: buyerEmailMeta,
      buyerPhone: buyerPhoneMeta,
      buyerIBAN,
      buyerBankName,
      // Line/item and invoice options
      serviceCode,
      vatRate,
      measureUnit,
      measureCode,
      paymentMethod,
      sendInvoiceEmail,
      eInvoice,
      dueDays
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
      tipConferinta: tipConferinta,
      // Buyer/company metadata (Stripe metadata supports only strings)
      ...(buyerType ? { buyerType } : {}),
      ...(buyerCif ? { buyerCif } : {}),
      ...(buyerCnp ? { buyerCnp } : {}),
      ...(buyerCompanyName ? { buyerCompanyName } : {}),
      ...(buyerRegCom ? { buyerRegCom } : {}),
      ...(typeof buyerVatPayer !== "undefined" ? { buyerVatPayer: String(!!buyerVatPayer) } : {}),
      ...(buyerStreet ? { buyerStreet } : {}),
      ...(buyerCity ? { buyerCity } : {}),
      ...(buyerCounty ? { buyerCounty } : {}),
      ...(buyerPostalCode ? { buyerPostalCode } : {}),
      ...(buyerCountry ? { buyerCountry } : {}),
      ...(buyerContactName ? { buyerContactName } : {}),
      ...(buyerEmailMeta ? { buyerEmail: buyerEmailMeta } : {}),
      ...(buyerPhoneMeta ? { buyerPhone: buyerPhoneMeta } : {}),
      ...(buyerIBAN ? { buyerIBAN } : {}),
      ...(buyerBankName ? { buyerBankName } : {}),
      // Line and invoice options
      ...(serviceCode ? { serviceCode } : {}),
      ...(typeof vatRate !== "undefined" ? { vatRate: String(vatRate) } : {}),
      ...(measureUnit ? { measureUnit } : {}),
      ...(measureCode ? { measureCode } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(typeof sendInvoiceEmail !== "undefined" ? { sendInvoiceEmail: String(!!sendInvoiceEmail) } : {}),
      ...(typeof eInvoice !== "undefined" ? { eInvoice: String(!!eInvoice) } : {}),
      ...(typeof dueDays !== "undefined" ? { dueDays: String(dueDays) } : {})
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
      locale: 'ro', // Setează limba pentru interfața de checkout
      success_url: `${req.headers.origin}/success-conferinta-grup?session_id={CHECKOUT_SESSION_ID}&conferinta_id=${conferintaId}`,
      cancel_url: `${req.headers.origin}/calendar-conferinte-grup`,
      customer_email: participantData.email,
      billing_address_collection: 'required', // Solicită adresa de facturare pentru Oblio
      phone_number_collection: { enabled: true }, // Solicită numărul de telefon
      metadata: metadata,
      // Adaugă opțiunea pentru crearea unei facturi automate
      invoice_creation: {
        enabled: true,
      },
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