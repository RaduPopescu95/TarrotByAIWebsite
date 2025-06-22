const nodemailer = require("nodemailer");
const moment = require("moment");

// Configurații pentru Nodemailer (aceleași ca în Firebase Functions)
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com",
    pass: "ypeb yvmi ygat lahn",
  },
});

// Lista de UIDs admin autorizate
const adminUIDs = [
  "zFsAwNZA5bUonVRIQzRn2HZB3y62",
  "BhJZdiWVQJNnbLOCGWxzjGHVjHB2", 
  "MSBePxFVcVO3vsfM5nwHr36ROfh2"
];

export default async function handler(req, res) {
  console.log("🚀 [CONFERENCE EMAIL API] Request primit:", req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipients, conferenceData, emailType, userUID } = req.body;

    // Verifică autorizarea admin
    if (!userUID || !adminUIDs.includes(userUID)) {
      console.error("❌ [CONFERENCE EMAIL API] UID neautorizat:", userUID);
      return res.status(403).json({ error: 'Acces interzis. Doar adminii pot trimite email-uri.' });
    }

    // Validează datele de intrare
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Lista de destinatari este invalidă' });
    }

    if (!conferenceData) {
      return res.status(400).json({ error: 'Datele conferinței lipsesc' });
    }

    console.log("📧 [CONFERENCE EMAIL API] Destinatari:", recipients.length);
    console.log("📅 [CONFERENCE EMAIL API] Conferința:", conferenceData.titlu);

    // Construiește link-ul de acces
    const conferenceLink = `https://www.cristinazurba.com/conferinta-grup/${conferenceData.accessLink}`;

    // Formatează datele conferinței
    const formatConferenceData = (conferinta) => {
      const dataInceput = moment(conferinta.dataInceput);
      const dataFinal = conferinta.dataFinal ? moment(conferinta.dataFinal) : null;
      
      if (conferinta.tipConferinta === "course" && dataFinal) {
        return {
          type: "Curs Multi-zi",
          dataRange: `${dataInceput.format("DD MMMM YYYY")} - ${dataFinal.format("DD MMMM YYYY")}`,
          oraRange: `${conferinta.oraInceput} - ${conferinta.oraFinal}`
        };
      } else {
        return {
          type: "Conferință Unică",
          dataRange: dataInceput.format("DD MMMM YYYY"),
          oraRange: conferinta.oraInceput
        };
      }
    };

    const displayInfo = formatConferenceData(conferenceData);

    // Construiește subject-ul email-ului
    const emailSubject = `Acces la conferința: ${conferenceData.titlu}`;

    // Rezultatele trimiterii
    const results = [];

    // Trimite email-uri individuale pentru fiecare destinatar
    for (const recipient of recipients) {
      try {
        console.log(`📤 [CONFERENCE EMAIL API] Trimitere către: ${recipient.email}`);

        // Construiește corpul email-ului personalizat
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin-bottom: 10px;">🎯 Conferință de Grup</h1>
                <h2 style="color: #3498db; margin: 0;">${conferenceData.titlu}</h2>
              </div>

              <!-- Salut personalizat -->
              <p style="font-size: 16px; color: #34495e; margin-bottom: 20px;">
                Bună ziua <strong>${recipient.nume}</strong>,
              </p>

              <p style="font-size: 16px; color: #34495e; line-height: 1.6; margin-bottom: 25px;">
                Vă trimitem ${emailType === 'reminder' ? 'din nou ' : ''}link-ul de acces pentru conferința de grup la care v-ați înregistrat:
              </p>

              <!-- Detalii conferință -->
              <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px;">📋 DETALII CONFERINȚĂ</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 8px; color: #34495e;"><strong>• Titlu:</strong> ${conferenceData.titlu}</li>
                  <li style="margin-bottom: 8px; color: #34495e;"><strong>• Tip:</strong> ${displayInfo.type}</li>
                  <li style="margin-bottom: 8px; color: #34495e;"><strong>• Data:</strong> ${displayInfo.dataRange}</li>
                  <li style="margin-bottom: 8px; color: #34495e;"><strong>• Ora:</strong> ${displayInfo.oraRange}</li>
                </ul>
              </div>

              <!-- Link de acces -->
              <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">🔗 LINK DE ACCES</h3>
                <a href="${conferenceLink}" 
                   style="display: inline-block; background-color: #3498db; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  ACCESEAZĂ CONFERINȚA
                </a>
                <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">
                  Sau copiați acest link: <br>
                  <span style="word-break: break-all;">${conferenceLink}</span>
                </p>
              </div>

              <!-- Instrucțiuni -->
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
                <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">📝 INSTRUCȚIUNI IMPORTANTE</h3>
                <ol style="color: #856404; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Accesați link-ul cu <strong>30 de minute înainte</strong> de începerea conferinței</li>
                  <li style="margin-bottom: 8px;">Asigurați-vă că aveți o <strong>conexiune stabilă la internet</strong></li>
                  <li style="margin-bottom: 8px;">Testați <strong>camera și microfonul</strong> înainte de conferință</li>
                  <li style="margin-bottom: 8px;">Pentru suport tehnic, contactați-ne la acest email</li>
                </ol>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 10px;">
                  Vă așteptăm cu drag la conferință! 🌟
                </p>
                <p style="color: #34495e; font-weight: bold; margin: 0;">
                  Cu stimă,<br>
                  <span style="color: #3498db;">Echipa Cristina Zurba</span>
                </p>
              </div>

            </div>
          </div>
        `;

        const mailOptions = {
          from: "webdynamicx@gmail.com",
          to: recipient.email,
          subject: emailSubject,
          html: emailBody,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [CONFERENCE EMAIL API] Email trimis cu succes către ${recipient.email}:`, info.messageId);
        
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId
        });

      } catch (error) {
        console.error(`❌ [CONFERENCE EMAIL API] Eroare la trimiterea către ${recipient.email}:`, error);
        results.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    // Calculează statisticile
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 [CONFERENCE EMAIL API] Rezultate: ${successful} succese, ${failed} eșecuri`);

    res.status(200).json({
      success: true,
      message: `Email-uri trimise: ${successful} succese, ${failed} eșecuri`,
      results: results,
      stats: {
        total: recipients.length,
        successful: successful,
        failed: failed
      }
    });

  } catch (error) {
    console.error("💥 [CONFERENCE EMAIL API] Eroare generală:", error);
    res.status(500).json({ 
      error: 'Eroare internă', 
      message: error.message 
    });
  }
} 