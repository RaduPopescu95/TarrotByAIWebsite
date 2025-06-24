import Stripe from 'stripe';
import { handleGetFirestore, handleUpdateFirestore } from '../../utils/firestoreUtils';
import nodemailer from 'nodemailer';

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

// Configurația Gmail pentru trimiterea email-urilor
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com",
    pass: "ypeb yvmi ygat lahn",
  },
});

// Template HTML pentru emailul de confirmare
const createEmailTemplate = (participantData, conferintaData, accessLink, isTestMode = false) => {
  const { nume, prenume, email } = participantData;
  const { titlu, descriere, tipConferinta, dataInceput, dataFinal, oraInceput, oraFinal, pretParticipare } = conferintaData;
  
  // Format data display
  let dataDisplay = '';
  if (tipConferinta === 'course') {
    const startDate = new Date(dataInceput).toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const endDate = new Date(dataFinal).toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    dataDisplay = `${startDate} - ${endDate}`;
  } else {
    dataDisplay = new Date(dataInceput).toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  const testModeAlert = isTestMode ? `
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
      <h3 style="color: #856404; margin: 0; font-size: 18px;">🧪 MOD TEST ACTIV</h3>
      <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">
        Aceasta este o simulare. Nu s-a efectuat nicio plată reală.
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmare Înscriere - ${titlu}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        ${testModeAlert}
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0; font-size: 28px;">✅ Confirmare Înscriere</h1>
          <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 16px;">
            ${isTestMode ? 'Simularea ta a fost completată cu succes!' : 'Plata ta a fost procesată cu succes!'}
          </p>
        </div>

        <!-- Salut personal -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #333; font-size: 22px;">Bună ${prenume}!</h2>
          <p style="font-size: 16px; margin: 10px 0;">
            Înregistrarea ta pentru <strong>${titlu}</strong> a fost confirmată cu succes.
          </p>
        </div>

        <!-- Detalii conferință -->
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #007bff; margin: 0 0 15px 0; font-size: 20px;">📅 Detalii ${tipConferinta === 'course' ? 'Curs' : 'Conferință'}</h3>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #495057;">Titlu:</strong> ${titlu}
          </div>
            
          <div style="margin-bottom: 12px;">
            <strong style="color: #495057;">Tip:</strong> 
            <span style="background-color: ${tipConferinta === 'course' ? '#17a2b8' : '#007bff'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${tipConferinta === 'course' ? 'CURS' : 'CONFERINȚĂ'}
            </span>
          </div>
                
          <div style="margin-bottom: 12px;">
            <strong style="color: #495057;">Data:</strong> ${dataDisplay}
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #495057;">Ora:</strong> ${oraInceput}${tipConferinta === 'course' ? ` - ${oraFinal}` : ''}
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #495057;">Participant:</strong> ${nume} ${prenume}
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #495057;">Email:</strong> ${email}
          </div>

          <div>
            <strong style="color: #495057;">Preț:</strong> 
            <span style="color: #28a745; font-weight: bold; font-size: 18px;">${pretParticipare} RON</span>
            ${isTestMode ? ' <span style="color: #856404; font-size: 14px;">(SIMULAT)</span>' : ''}
          </div>
        </div>
            
        <!-- Link de acces -->
        <div style="background-color: #e7f3ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #007bff; margin: 0 0 15px 0; font-size: 18px;">🔗 Link de Acces</h3>
          <p style="margin-bottom: 15px; font-size: 16px; color: #333; font-weight: bold;">
            Accesează ${tipConferinta === 'course' ? 'cursul' : 'conferința'}:
          </p>
          <p style="margin-bottom: 15px; font-size: 16px; color: #007bff; word-break: break-all; line-height: 1.4;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/conferinta-grup/${accessLink}" 
               style="color: #007bff; text-decoration: underline; font-weight: bold;">
              ${process.env.NEXT_PUBLIC_SITE_URL}/conferinta-grup/${accessLink}
            </a>
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #6c757d;">
            ${tipConferinta === 'course' ? 'Link-ul este valabil pentru toată perioada cursului' : 'Salvează acest link într-un loc sigur'}
          </p>
          <p style="margin-top: 10px; font-size: 14px; color: #28a745; font-weight: bold;">
            💡 Copiază și salvează acest link pentru acces rapid!
          </p>
        </div>

        <!-- Instrucțiuni -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">📋 Instrucțiuni Importante</h3>
          <ul style="padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;">Conferința se desfășoară online prin video call</li>
            <li style="margin-bottom: 8px;">Accesați link-ul la data si ora de începere a conferinței</li>
            <li style="margin-bottom: 8px;">Asigură-te că ai o conexiune stabilă la internet</li>
            <li style="margin-bottom: 8px;">Recomandăm folosirea unui laptop sau computer pentru o experiență optimă</li>
            ${tipConferinta === 'course' ? '<li style="margin-bottom: 8px;">Link-ul de acces este același pentru toate sesiunile cursului</li>' : ''}
          </ul>
        </div>

        <!-- Contact -->
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">📞 Ai întrebări?</h4>
          <p style="margin: 0; font-size: 14px; color: #6c757d;">
            Pentru orice întrebări sau probleme tehnice, nu ezita să ne contactezi.
            Suntem aici să te ajutăm!
            webdynamicx@gmail.com
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
            Acest email a fost trimis automat.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

async function sendConfirmationEmail({ participantEmail, participantName, conferinta, uniqueAccessLink, tipConferinta }) {
  try {
    console.log("📧 [STRIPE WEBHOOK] Începe trimiterea emailului de confirmare...");
    console.log("📧 [STRIPE WEBHOOK] Participant:", participantName, "Email:", participantEmail);

    // Separare nume și prenume din participantName
    const nameParts = participantName.split(' ');
    const prenume = nameParts.slice(0, -1).join(' ') || participantName;
    const nume = nameParts.slice(-1)[0] || participantName;

    // Formatez datele participant pentru template
    const participantData = {
      nume: nume,
      prenume: prenume,
      email: participantEmail
    };

    // Formatez datele conferință pentru template
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

    console.log("📧 [STRIPE WEBHOOK] Date formatate pentru email:", {
      participant: `${nume} ${prenume}`,
      email: participantEmail,
      conferinta: conferinta.titlu,
      accessLink: uniqueAccessLink
    });

    // Creez template-ul HTML
    const htmlContent = createEmailTemplate(participantData, conferintaData, uniqueAccessLink, false);

    // Configurez și trimit email-ul
    const mailOptions = {
      from: '"Cristina Zurba - Tarot" <webdynamicx@gmail.com>',
      to: participantEmail,
      subject: `✅ Confirmare Înscriere - ${conferinta.titlu}`,
      html: htmlContent,
    };

    console.log("📧 [STRIPE WEBHOOK] Trimite email-ul direct prin NodeMailer...");
    const result = await transporter.sendMail(mailOptions);

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