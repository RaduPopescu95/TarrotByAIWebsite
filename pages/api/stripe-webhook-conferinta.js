import Stripe from 'stripe';
import { handleGetFirestore, handleUpdateFirestore } from '../../utils/firestoreUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_CONFERINTA;

// Funcție helper pentru a citi raw body din stream
const buffer = async (readable) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Preiau raw body-ul pentru verificarea signaturii
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log("✅ [STRIPE WEBHOOK] Signatura verificată cu succes");
  } catch (err) {
    console.error('❌ [STRIPE WEBHOOK] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;
    case 'invoice.created':
      const invoice = event.data.object;
      await handleInvoiceCreated(invoice);
      break;
    case 'payment_intent.succeeded':
      // Handle successful payment if needed
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}

async function handleInvoiceCreated(invoice) {
  try {
    console.log("🧾 [STRIPE WEBHOOK] Procesez factura creată...");
    console.log("🧾 [STRIPE WEBHOOK] Invoice ID:", invoice.id);
    console.log("🧾 [STRIPE WEBHOOK] Payment Intent:", invoice.payment_intent);

    // Încerc să găsesc sesiunea de checkout pe baza payment intent-ului
    if (invoice.payment_intent) {
      try {
        // Caut în toate sesiunile de checkout recente pentru acest payment intent
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: invoice.payment_intent,
          limit: 1
        });
        
        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          
          // Verific dacă este o sesiune pentru conferințe
          if (session.metadata && session.metadata.conferintaId) {
            console.log("🧾 [STRIPE WEBHOOK] Factura pentru conferință găsită");
            console.log("🧾 [STRIPE WEBHOOK] Session metadata:", session.metadata);
            
            // Actualizez metadata facturii cu informațiile conferinței
            await stripe.invoices.update(invoice.id, {
              metadata: {
                conferintaId: session.metadata.conferintaId || '',
                participantName: session.metadata.participantName || '',
                participantEmail: session.metadata.participantEmail || '',
                participantPhone: session.metadata.participantPhone || '',
                tipConferinta: session.metadata.tipConferinta || '',
                observatii: session.metadata.observatii || '',
                uniqueAccessLink: session.metadata.uniqueAccessLink || '',
                stripeCustomerId: session.metadata.stripeCustomerId || ''
              },
            });
            
            console.log("✅ [STRIPE WEBHOOK] Metadata factură actualizată pentru conferință");
          } else {
            console.log("🧾 [STRIPE WEBHOOK] Factura nu este pentru conferințe");
          }
        } else {
          console.log("⚠️ [STRIPE WEBHOOK] Nu s-a găsit sesiunea pentru payment intent:", invoice.payment_intent);
        }
      } catch (error) {
        console.log("⚠️ [STRIPE WEBHOOK] Eroare la căutarea sesiunii:", error.message);
      }
    } else {
      console.log("⚠️ [STRIPE WEBHOOK] Factura nu are payment intent asociat");
    }
  } catch (error) {
    console.error('💥 [STRIPE WEBHOOK] Eroare la procesarea facturii:', error);
  }
}

async function handleSuccessfulPayment(session) {
  try {
    console.log("💳 [STRIPE WEBHOOK] Procesez plata reușită...");
    console.log("💳 [STRIPE WEBHOOK] Session ID:", session.id);
    console.log("💳 [STRIPE WEBHOOK] Amount paid:", session.amount_total / 100, "RON");

    const {
      conferintaId,
      userId,
      uniqueAccessLink,
      participantName,
      participantEmail,
      participantPhone,
      observatii,
      tipConferinta,
      stripeCustomerId
    } = session.metadata;

    console.log("💳 [STRIPE WEBHOOK] Metadata:", {
      conferintaId,
      userId,
      uniqueAccessLink,
      participantName,
      participantEmail,
      tipConferinta
    });

    // 1. Actualizez sesiunea de plată în Firestore
    console.log("💳 [STRIPE WEBHOOK] Actualizez sesiunea de plată...");
    const platiConferinte = await handleGetFirestore('PlatiConferinteGrup');
    const paymentSession = platiConferinte.find(p => p.stripeSessionId === session.id);
    
    if (paymentSession) {
      await handleUpdateFirestore(
        `PlatiConferinteGrup/${paymentSession.documentId}`,
        {
          ...paymentSession,
          status: 'completed',
          completedAt: new Date().toISOString(),
          stripePaymentId: session.payment_intent
        }
      );
      console.log("✅ [STRIPE WEBHOOK] Sesiunea de plată actualizată");
    } else {
      console.log("⚠️ [STRIPE WEBHOOK] Sesiunea de plată nu a fost găsită în Firestore");
    }

    // 2. Adaug participantul la conferință
    console.log("💳 [STRIPE WEBHOOK] Adaug participantul la conferință...");
    const conferinte = await handleGetFirestore('ConferinteGrup');
    const conferinta = conferinte.find(c => c.documentId === conferintaId);
    
    if (conferinta) {
      console.log("✅ [STRIPE WEBHOOK] Conferința găsită:", conferinta.titlu);
      
      // Separare nume și prenume din participantName
      const nameParts = participantName.split(' ');
      const prenume = nameParts.slice(0, -1).join(' ') || participantName;
      const nume = nameParts.slice(-1)[0] || participantName;

      // Preiau adresa de facturare din checkout-ul Stripe
      let billingAddress = {};
      
      try {
        // Adresa din session.customer_details (completată în checkout)
        if (session.customer_details?.address) {
          billingAddress = session.customer_details.address;
          console.log("💳 [STRIPE WEBHOOK] Adresa din checkout Stripe:", billingAddress);
        } else {
          console.log("⚠️ [STRIPE WEBHOOK] Nu s-a găsit adresa în checkout");
        }
      } catch (error) {
        console.log("⚠️ [STRIPE WEBHOOK] Eroare la preluarea adresei:", error.message);
        billingAddress = {};
      }
      
      const newParticipant = {
        userId: userId,
        nume: nume,
        prenume: prenume,
        email: participantEmail,
        telefon: participantPhone,
        observatii: observatii,
        uniqueAccessLink: uniqueAccessLink,
        dataInscrierii: new Date().toISOString(),
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
        stripeCustomerId: stripeCustomerId,
        status: 'confirmed',
        // Adresa de facturare din checkout-ul Stripe
        adresa: billingAddress.line1 || '',
        oras: billingAddress.city || '',
        judet: billingAddress.state || '',
        codPostal: billingAddress.postal_code || '',
        tara: billingAddress.country === 'RO' ? 'România' : 'România',
        // Adresa completă din checkout-ul Stripe
        stripeCheckoutAddress: billingAddress
      };

      console.log("💳 [STRIPE WEBHOOK] Date participant nou:", newParticipant);

      // Verific dacă participantul nu este deja înscris
      const participantiExistenti = conferinta.participanti || [];
      const isAlreadyRegistered = participantiExistenti.some(p => p.userId === userId);

      if (!isAlreadyRegistered) {
        const updatedParticipanti = [...participantiExistenti, newParticipant];
        
        await handleUpdateFirestore(
          `ConferinteGrup/${conferintaId}`,
          {
            ...conferinta,
            participanti: updatedParticipanti
          }
        );
        console.log("✅ [STRIPE WEBHOOK] Participant adăugat cu succes");
      } else {
        console.log("⚠️ [STRIPE WEBHOOK] Participantul este deja înscris");
      }

      // 3. Trimit email de confirmare cu link-ul de acces
      console.log("💳 [STRIPE WEBHOOK] Începe trimiterea emailului...");
      await sendConfirmationEmail({
        participantEmail: participantEmail,
        participantName: participantName,
        conferinta: conferinta,
        uniqueAccessLink: uniqueAccessLink,
        tipConferinta: tipConferinta
      });
    } else {
      console.log("❌ [STRIPE WEBHOOK] Conferința nu a fost găsită:", conferintaId);
    }

    console.log('✅ [STRIPE WEBHOOK] Procesare completă pentru:', participantEmail);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function sendConfirmationEmail({ participantEmail, participantName, conferinta, uniqueAccessLink, tipConferinta }) {
  try {
    console.log("📧 [STRIPE WEBHOOK] Începe trimiterea emailului de confirmare...");
    console.log("📧 [STRIPE WEBHOOK] Participant:", participantName, "Email:", participantEmail);

    // Formatez datele participant pentru noul API (identic cu test)
    const participantData = {
      nume: nume,
      prenume: prenume,
      email: participantEmail
    };

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

    const emailPayload = {
      participantData: participantData,
      conferintaData: conferintaData,
      accessLink: uniqueAccessLink,
      isTestMode: false // Plata reală prin Stripe
    };

    console.log("📧 [STRIPE WEBHOOK] Date formatate pentru API:", emailPayload);

    // Trimite email-ul prin noul nostru API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email-conferinta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    console.log("✅ [STRIPE WEBHOOK] Email trimis cu succes!");
    console.log("✅ [STRIPE WEBHOOK] Message ID:", result.messageId);
    
  } catch (error) {
    console.error("💥 [STRIPE WEBHOOK] Eroare la trimiterea emailului:");
    console.error("💥 [STRIPE WEBHOOK] Error message:", error.message);
    console.error("💥 [STRIPE WEBHOOK] Error stack:", error.stack);
  }
}

// Configurare pentru raw body parsing (necesar pentru Stripe webhook)
export const config = {
  api: {
    bodyParser: false, // Dezactivez body parser-ul pentru a primi raw body
  },
} 