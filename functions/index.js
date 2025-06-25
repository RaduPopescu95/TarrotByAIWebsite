const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Twilio = require("twilio");
const moment = require("moment"); // Importă moment.js pentru a formata datele

// Configurații Twilio
const aS = "AC6cf01717a74bbf7cc02d4a723db53232";
const aT = "8c6b979039e8d0fb5aa878dcc2eefac6";
const client = new Twilio(aS, aT);

// Configurații pentru Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com",
    pass: "ypeb yvmi ygat lahn",
  },
});

// Inițializează Firebase Admin SDK
admin.initializeApp();

// Funcție pentru a formata data slotului selectat
const formatSelectedSlot = (selectedSlotDay, selectedyear) => {
  // Verificăm dacă `selectedSlotDay` este valid înainte de a-l procesa
  if (!selectedSlotDay || !selectedyear) {
    console.warn("Date incomplete: selectedSlotDay sau selectedyear lipsesc.");
    return null; // Sau o valoare prestabilită, ex: `""`
  }

  console.log("selectedSlotDay....", selectedSlotDay);
  console.log("selectedyear....", selectedyear);

  // Split și conversie în numere doar dacă selectedSlotDay este definit
  const [monthIndex, day] = selectedSlotDay.split("-").map(Number);
  const correctMonth = monthIndex + 1; // Corectare index lună

  const formattedDate = moment(
      `${selectedyear}-${correctMonth}-${day}`,
      "YYYY-MM-DD",
  ).format("DD-MM-YYYY");

  return formattedDate;
};

// Funcție pentru a trimite notificări la o rezervare nouă
exports.sendNotificationOnNewReservation = functions.firestore
    .document("RezervariConsultatii/{documentId}")
    .onCreate((snap, context) => {
      console.log("Funcția sendNotificationOnNewReservation a fost apelată.");

      const newReservation = snap.data();
      console.log("Datele noii rezervări:", newReservation);

      // Extrage datele din documentul nou creat
      const email = newReservation.email;
      const telefon = newReservation.telefon;
      const meetingCode = newReservation.meetingCode;
      const day = newReservation.selectedSlot.day;
      const year = newReservation.selectedSlot.currentYear;
      const time = newReservation.selectedSlot.slot;
      const documentId = context.params.documentId;

      console.log(
          `Email: ${email}, Telefon: ${telefon}, Meeting Code: ${meetingCode}`,
      );
      console.log(`Data: ${day}-${year}, Ora: ${time}, Doc: ${documentId}`);

      // Construcția mesajului de e-mail
      const emailMessage =
      `<p>Rezervarea dumneavoastră cu Cristina Zurba a fost realizată.</p>` +
      `<p>Vă rugăm să accesați:</p>` +
      `<p><a href="https://www.cristinazurba.com/meeting?meetingCode=` +
      `${meetingCode}__${documentId}">` +
      `www.cristinazurba.com/meeting?meetingCode=` +
      `${meetingCode}__${documentId}</a></p>` +
      `<p>la data de ${formatSelectedSlot(day, year)} la ora ${time}.</p>` +
      `<p>Dacă întâmpinați dificultăți în utilizarea platformei, ` +
      `nu ezitați să contactați echipa de dezvoltare la ` +
      `<a href="https://www.webappdynamicx.ro/contact">www.webappdynamicx.ro/contact</a>.</p>`;

      // Construcția mesajului de SMS/WhatsApp
      const smsMessage =
      `Rezervarea dumneavoastră cu Cristina Zurba a fost realizată.\n` +
      `Vă rugăm să accesați:\n` +
      `https://www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}\n` +
      `la data de ${formatSelectedSlot(day, year)} la ora ${time}.\n` +
      `Dacă întâmpinați dificultăți în utilizarea platformei, ` +
      `nu ezitați să contactați echipa de dezvoltare la ` +
      `https://www.webappdynamicx.ro/contact`;

      // Trimiterea e-mailului
      const mailOptions = {
        from: "webdynamicx@gmail.com",
        to: email,
        subject: "Confirmare Rezervare Consultatie - Cristina Zurba",
        html: emailMessage,
      };

      console.log("Opțiunile de email:", mailOptions);

      console.log("Trimiterea email-ului, SMS-ului și WhatsApp-ului...");

      // Trimiterea emailului, SMS-ului și a mesajului WhatsApp
      return Promise.all([
        transporter.sendMail(mailOptions).then((info) => {
          console.log("E-mail trimis cu succes:", info);
        }),
        client.messages
            .create({
              body: smsMessage,
              from: "+15042266134", // Număr Twilio valid
              to: telefon,
            })
            .then((message) => {
              console.log("SMS trimis cu succes:", message.sid);
            }),
      ])
          .then(() => {
            console.log("E-mail, SMS și WhatsApp trimise cu succes!");
          })
          .catch((error) => {
            console.error("Eroare la trimiterea notificărilor:", error);
          });
    });

// Funcție pentru trimiterea email-urilor pentru conferințele de grup
exports.sendConferenceGroupEmail = functions.https.onCall(async (data, context) => {
  console.log("🚀 [CONFERENCE EMAIL] Funcția sendConferenceGroupEmail a fost apelată");
  console.log("📨 [CONFERENCE EMAIL] Date primite:", data);

  try {
    // Verifică autentificarea
    if (!context.auth) {
      console.error("❌ [CONFERENCE EMAIL] Utilizator neautentificat");
      throw new functions.https.HttpsError('unauthenticated', 'Utilizatorul trebuie să fie autentificat');
    }

    // Verifică dacă utilizatorul este admin
    const adminUIDs = [
      "zFsAwNZA5bUonVRIQzRn2HZB3y62",
      "BhJZdiWVQJNnbLOCGWxzjGHVjHB2",
      "MSBePxFVcVO3vsfM5nwHr36ROfh2",
      "AW8kjQIhAiaJM5q0QgGlOKpGF2j1"
    ];

    if (!adminUIDs.includes(context.auth.uid)) {
      console.error("❌ [CONFERENCE EMAIL] Utilizator fără permisiuni admin");
      throw new functions.https.HttpsError('permission-denied', 'Doar adminii pot trimite email-uri');
    }

    const { recipients, conferenceData, emailType } = data;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Lista de destinatari este invalidă');
    }

    if (!conferenceData) {
      throw new functions.https.HttpsError('invalid-argument', 'Datele conferinței lipsesc');
    }

    console.log("📧 [CONFERENCE EMAIL] Destinatari:", recipients.length);
    console.log("📅 [CONFERENCE EMAIL] Conferința:", conferenceData.titlu);

    // Construiește link-ul de acces
    const conferenceLink = `https://www.cristinazurba.com/conferinta-grup/${conferenceData.accessLink}`;

    // Formatează datele conferinței
    const formatConferenceData = (conferinta) => {
      const dataIncepere = moment(conferinta.dataIncepere);
      const dataFinal = conferinta.dataFinal ? moment(conferinta.dataFinal) : null;
      
      if (conferinta.tipConferinta === "course" && dataFinal) {
        return {
          type: "Curs Multi-zi",
          dataRange: `${dataIncepere.format("DD MMMM YYYY")}, ${conferinta.oraIncepere} - ${dataFinal.format("DD MMMM YYYY")}, ${conferinta.oraFinal}`,
          oraRange: `${conferinta.oraIncepere} - ${conferinta.oraFinal}`
        };
      } else {
        return {
          type: "Conferință Unică",
          dataRange: dataIncepere.format("DD MMMM YYYY"),
          oraRange: conferinta.oraIncepere
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
        console.log(`📤 [CONFERENCE EMAIL] Trimitere către: ${recipient.email}`);

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
                  <li style="margin-bottom: 8px; color: #34495e;"><strong>• ${conferenceData.tipConferinta === 'course' ? 'Interval' : 'Data & Ora'}:</strong> ${displayInfo.dataRange}</li>
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
        console.log(`✅ [CONFERENCE EMAIL] Email trimis cu succes către ${recipient.email}:`, info.messageId);
        
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId
        });

      } catch (error) {
        console.error(`❌ [CONFERENCE EMAIL] Eroare la trimiterea către ${recipient.email}:`, error);
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

    console.log(`📊 [CONFERENCE EMAIL] Rezultate: ${successful} succese, ${failed} eșecuri`);

    return {
      success: true,
      message: `Email-uri trimise: ${successful} succese, ${failed} eșecuri`,
      results: results,
      stats: {
        total: recipients.length,
        successful: successful,
        failed: failed
      }
    };

  } catch (error) {
    console.error("💥 [CONFERENCE EMAIL] Eroare generală:", error);
    throw new functions.https.HttpsError('internal', `Eroare la trimiterea email-urilor: ${error.message}`);
  }
});
