const nodemailer = require('nodemailer');

// Configurația Gmail (aceeași ca în functions/index.js)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com",
    pass: "ypeb yvmi ygat lahn",
  },
});

// Template HTML pentru emailul de confirmare
const createEmailTemplate = (participantData, conferintaData, accessLink, isTestMode = false) => {
  const { nume, prenume, email, metodaPlata } = participantData;
  const { titlu, descriere, tipConferinta, dataInceput, dataFinal, oraInceput, oraFinal, pretParticipare } = conferintaData;
  
  // Verifică dacă participantul a fost adăugat manual
  const isManuallyAdded = metodaPlata === "MANUAL_ADMIN";
  
  // Determină URL-ul de bază pentru site (producție vs dezvoltare)
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://www.cristinazurba.com' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristinazurba.com');
  
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
            ${isTestMode ? 'Simularea ta a fost completată cu succes!' : 
              isManuallyAdded ? 'Înregistrarea ta a fost confirmată cu succes!' : 
              'Plata ta a fost procesată cu succes!'}
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
            <a href="${baseUrl}/conferinta-grup/${accessLink}" 
               style="color: #007bff; text-decoration: underline; font-weight: bold;">
              ${baseUrl}/conferinta-grup/${accessLink}
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log("❌ [EMAIL API] Metodă HTTP incorectă:", req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participantData, conferintaData, accessLink, isTestMode = false } = req.body;

    console.log("📧 [EMAIL API] Începe trimiterea emailului...");
    console.log("📧 [EMAIL API] Date primite:", {
      participant: participantData?.nume + " " + participantData?.prenume,
      email: participantData?.email,
      conferinta: conferintaData?.titlu,
      accessLink: accessLink,
      isTestMode: isTestMode
    });

    // Validare date
    if (!participantData || !conferintaData || !accessLink) {
      console.log("❌ [EMAIL API] Date lipsă pentru trimiterea emailului");
      return res.status(400).json({ error: 'Date incomplete pentru trimiterea emailului' });
    }

    if (!participantData.email || !participantData.nume || !participantData.prenume) {
      console.log("❌ [EMAIL API] Date participant incomplete");
      return res.status(400).json({ error: 'Date participant incomplete' });
    }

    if (!conferintaData.titlu || !conferintaData.dataInceput) {
      console.log("❌ [EMAIL API] Date conferință incomplete");
      return res.status(400).json({ error: 'Date conferință incomplete' });
    }

    console.log("✅ [EMAIL API] Validarea datelor a trecut cu succes");

    // Generez template-ul HTML
    const htmlContent = createEmailTemplate(participantData, conferintaData, accessLink, isTestMode);
    console.log("✅ [EMAIL API] Template HTML generat");

    // Configurez emailul
    const mailOptions = {
      from: {
        name: 'Conferințe de Grup - Cristina Zurba',
        address: 'webdynamicx@gmail.com'
      },
      to: participantData.email,
      subject: `${isTestMode ? '🧪 [TEST] ' : ''}Confirmare Înscriere - ${conferintaData.titlu}`,
      html: htmlContent,
      // Adaug și versiunea text pentru compatibilitate
      text: `
        ${isTestMode ? 'MOD TEST ACTIV - Aceasta este o simulare.\n\n' : ''}
        Bună ${participantData.prenume}!
        
        Înregistrarea ta pentru "${conferintaData.titlu}" a fost confirmată.
        
        Detalii:
        - Tip: ${conferintaData.tipConferinta === 'course' ? 'Curs' : 'Conferință'}
        - Data: ${conferintaData.dataInceput}
        - Ora: ${conferintaData.oraInceput}
        - Participant: ${participantData.nume} ${participantData.prenume}
        - Preț: ${conferintaData.pretParticipare} RON ${isTestMode ? '(SIMULAT)' : ''}
        
        Link de acces: ${baseUrl}/conferinta-grup/${accessLink}
        
        Mulțumim!
      `
    };

    console.log("📧 [EMAIL API] Configurare email completă. Începe trimiterea...");
    console.log("📧 [EMAIL API] Destinatar:", participantData.email);
    console.log("📧 [EMAIL API] Subject:", mailOptions.subject);

    // Trimit emailul
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ [EMAIL API] Email trimis cu succes!");
    console.log("✅ [EMAIL API] Message ID:", info.messageId);
    console.log("✅ [EMAIL API] Response:", info.response);

    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email trimis cu succes' 
    });

  } catch (error) {
    console.error("💥 [EMAIL API] Eroare la trimiterea emailului:");
    console.error("💥 [EMAIL API] Error message:", error.message);
    console.error("💥 [EMAIL API] Error stack:", error.stack);
    
    return res.status(500).json({ 
      error: 'Eroare la trimiterea emailului', 
      details: error.message 
    });
  }
} 