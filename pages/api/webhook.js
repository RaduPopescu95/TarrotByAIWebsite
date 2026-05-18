// pages/api/webhook.js
import { buffer } from "micro";
import Stripe from "stripe";
import { handleUploadFirestoreGeneral } from "../../utils/firestoreUtils";
import { createOlbioInvoice } from "../../utils/olbioClient";
import { v4 as uuidv4 } from "uuid"; // Pentru generarea meetingCode identic cu frontend-ul
import { getAdminDb } from "../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Dezactivăm parserul de corp implicit al API-ului Next.js pentru a putea utiliza buffer-ul
export const config = {
  api: {
    bodyParser: false,
  },
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_TEST;

// Funcție pentru verificarea duplicatelor (identică cu frontend-ul)
const checkIfSessionExists = async (session_id) => {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("RezervariConsultatii")
      .where("session_id", "==", session_id)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return {
      documentId: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error(
      "Eroare la verificarea existenței session_id în Firestore:",
      error
    );
    return null;
  }
};

export default async (req, res) => {
  const requestId = `WH_CONSULT_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  console.log(`🔔 [${requestId}] ========== WEBHOOK CONSULTAȚII ÎNCEPUT ==========`);
  console.log(`🔔 [${requestId}] Method: ${req.method}`);
  
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // Verifică semnătura webhook-ului Stripe pentru a asigura autenticitatea
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
      console.log(`✅ [${requestId}] Semnătura Stripe validată cu succes`);
      console.log(`🔔 [${requestId}] Event type: ${event.type}`);
      console.log(`🔔 [${requestId}] Event ID: ${event.id}`);
    } catch (err) {
      console.error(`💥 [${requestId}] Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestionează tipul de eveniment primit de la Stripe
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const session_id = session.id;

        console.log(`💳 [${requestId}] Procesez checkout.session.completed`);
        console.log(`💳 [${requestId}] Session ID: ${session_id}`);
        console.log(`💳 [${requestId}] Session amount: ${session.amount_total / 100} RON`);
        console.log(`💳 [${requestId}] Customer email: ${session.customer_details?.email || session.customer_email}`);

        // 🔍 Detectează tipul de plată prin metadata
        const isConferencePayment = session.metadata?.conferintaId || session.metadata?.tipConferinta;
        const isPremiumSubscription = session.metadata?.flow === "site_premium";
        
        if (isPremiumSubscription) {
          console.log(`⚠️ [${requestId}] Plată pentru ABONAMENT PREMIUM detectată (flow=site_premium) - ignorată în webhook consultații`);
          break; // Skip processing — abonamentele sunt gestionate de webhook-ul premium dedicat
        }

        if (isConferencePayment) {
          console.log(`⚠️ [${requestId}] Plată pentru CONFERINȚĂ detectată - redirect către webhook conferințe`);
          console.log(`⚠️ [${requestId}] Metadata conferință:`, {
            conferintaId: session.metadata?.conferintaId,
            tipConferinta: session.metadata?.tipConferinta,
            participantName: session.metadata?.participantName
          });
          console.log(`⚠️ [${requestId}] Acest webhook procesează DOAR consultații individuale`);
          break; // Skip processing pentru conferințe
        }

        console.log(`✅ [${requestId}] Plată pentru CONSULTAȚIE INDIVIDUALĂ confirmată`);

        try {
          // 1. Verifică dacă rezervarea există deja (identic cu frontend-ul)
          console.log(`🔍 [${requestId}] Verifică dacă session_id există deja...`);
          const existingDocument = await checkIfSessionExists(session_id);
          
          if (existingDocument) {
            console.log(`⚠️ [${requestId}] Rezervarea există deja pentru session_id: ${session_id}`);
            console.log(`⚠️ [${requestId}] Document existent:`, existingDocument.documentId);
            break; // Skip processing dacă există deja
          }

          console.log(`✅ [${requestId}] Session nou, continuă procesarea...`);
          const db = getAdminDb();
          const checkoutSnap = await db.collection("consultationCheckoutSessions").doc(session_id).get();
          const checkoutAudit = checkoutSnap.exists ? checkoutSnap.data() || {} : {};

          // 2. Generează meetingCode (identic cu frontend-ul)
          const meetingCode = uuidv4();
          console.log(`🎯 [${requestId}] MeetingCode generat: ${meetingCode}`);

          // 3. Construiește rezervareData cu EXACT aceeași structură ca în frontend
          const rezervareData = {
            nume: session.metadata.nume,
            alteInformatii: session.metadata.alteInformatii,
            email: session.customer_details?.email || session.customer_email,
            telefon: session.metadata.telefon,
            categorie: JSON.parse(session.metadata.categorie),
            tipConsultatie: session.metadata.tipConsultatie,
            selectedSlot: JSON.parse(session.metadata.selectedSlot),
            costConsultatie: session.amount_total / 100, // Stripe stochează sumele în bani
            session_id: session_id, // ✅ Identic cu frontend
            meetingCode: meetingCode, // ✅ Identic cu frontend  
            meetingActive: false, // ✅ Identic cu frontend
            owner_uid: session.metadata.owner_uid || "", // ✅ Identic cu frontend
            adresaClient: session.metadata.adresaClient || "", // ✅ Identic cu frontend
            rawFormValues: checkoutAudit.rawFormValues || null,
            normalizedBeforeCheckout: checkoutAudit.normalizedBeforeCheckout || null,
            checkoutRequestPayload: checkoutAudit.checkoutRequestPayload || null,
            stripeMetadataSnapshot: checkoutAudit.stripeMetadataSnapshot || session.metadata || null,
            storedBillingSnapshot: {
              metadata: session.metadata || {},
              customerDetails: session.customer_details || null,
            },
            invoiceDecision: checkoutAudit.invoiceDecision || null,
          };

          console.log(`💳 [${requestId}] Date rezervare construite:`, JSON.stringify(rezervareData, null, 2));

          // 4. Salvează în Firestore (identic cu frontend-ul)
          console.log(`💾 [${requestId}] Salvez în Firestore...`);
          const data = await handleUploadFirestoreGeneral(
            rezervareData,
            "RezervariConsultatii"
          );
          
          console.log(`✅ [${requestId}] Rezervarea salvată cu documentId: ${data.documentId}`);
          console.log(`✅ [${requestId}] Procesare completă pentru: ${rezervareData.email}`);

          // ✅ OLBIO: creează factura după plată reușită (fail-safe, nu oprește webhook-ul)
          try {
            console.log(`🧾 [${requestId}] Creez factură în Olbio (consultatie)...`);
            const invoice = await createOlbioInvoice({
              type: "consultatie",
              rezervareData,
              session
            });
            if (invoice?.audit && data?.documentId) {
              await db.collection("RezervariConsultatii").doc(data.documentId).set(
                {
                  finalOblioPayload: invoice.audit.finalOblioPayload || null,
                  oblioResponse: invoice.audit.oblioResponse || invoice || null,
                  invoiceDecision: invoice.audit.invoiceDecision || rezervareData.invoiceDecision || null,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            }
            if (invoice?.id || invoice?.documentId) {
              console.log(`🧾 [${requestId}] Factură creată cu succes în Olbio`, invoice?.id || invoice?.documentId);
            } else {
              console.log(`🧾 [${requestId}] Factură Olbio nu a returnat ID (verifică logs/config).`);
            }
          } catch (olbioErr) {
            console.error(`💥 [${requestId}] Eroare creare factură Olbio:`, olbioErr?.message || olbioErr);
          }

        } catch (error) {
          console.error(`💥 [${requestId}] Eroare la procesarea rezervării:`, error.message);
          console.error(`💥 [${requestId}] Error stack:`, error.stack);
          console.error(`💥 [${requestId}] Session data:`, JSON.stringify(session, null, 2));
          // Nu aruncăm eroarea pentru a nu bloca webhook-ul
        }
        break;

      default:
        console.log(`⚠️ [${requestId}] Unhandled event type: ${event.type}`);
    }

    console.log(`🔔 [${requestId}] ========== WEBHOOK CONSULTAȚII FINAL ==========`);
    // Returnează un răspuns 200 pentru a indica faptul că evenimentul a fost procesat corect
    res.status(200).send("Success");
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
