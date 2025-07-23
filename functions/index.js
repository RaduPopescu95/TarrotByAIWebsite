/**
 * Firebase Functions pentru Platforma Cristina Zurba - TOATE FUNCȚIILE
 * 
 * Funcționalități:
 * 1. FUNCȚII EXISTENTE (păstrate din backup):
 *    - sendNotificationOnNewReservation (rezervări consultații)
 *    - sendConferenceGroupEmail (email-uri conferințe)
 * 
 * 2. FUNCȚII NOI (recording system):
 *    - uploadLargeRecording (upload unificat pentru TOATE înregistrările)
 *    - cleanupOldRecordings (cleanup automat înregistrări vechi)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Twilio = require("twilio");
const moment = require("moment");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import new recording functions
const { uploadLargeRecording, cleanupOldRecordings } = require('./uploadLargeRecording');

// Configurații Twilio (pentru funcțiile existente)
const aS = "AC6cf01717a74bbf7cc02d4a723db53232";
const aT = "8c6b979039e8d0fb5aa878dcc2eefac6";
const twilioClient = new Twilio(aS, aT);

// Configurații pentru Nodemailer (pentru funcțiile existente)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com",
    pass: "nnbf ezyh jgnx hlxv",
  },
});

// Helper function pentru formatare date (funcție existentă)
const formatSelectedSlot = (selectedSlotDay) => {
  console.log("selectedSlotDay....", selectedSlotDay);
  const [monthIndex, day] = selectedSlotDay.split("-").map(Number);
  const currentYear = moment().year();
  const correctMonth = monthIndex + 1;

  const formattedDate = moment(
    `${currentYear}-${correctMonth}-${day}`,
      "YYYY-MM-DD",
  ).format("DD-MM-YYYY");

  return formattedDate;
};

// ===========================================
// FUNCȚII EXISTENTE (PĂSTRATE DIN BACKUP)
// ===========================================

/**
 * FUNCȚIE EXISTENTĂ: Trimite notificări pentru rezervări noi
 */
exports.sendNotificationOnNewReservation = functions.firestore
    .document("RezervariConsultatii/{documentId}")
    .onCreate((snap, context) => {
    console.log("🔔 [EXISTING] sendNotificationOnNewReservation a fost apelată.");

      const newReservation = snap.data();
    console.log("📝 [EXISTING] Datele noii rezervări:", newReservation);

      // Extrage datele din documentul nou creat
      const email = newReservation.email;
      const telefon = newReservation.telefon;
      const meetingCode = newReservation.meetingCode;
      const day = newReservation.selectedSlot.day;
      const time = newReservation.selectedSlot.slot;
      const documentId = context.params.documentId;

    console.log(`📧 [EXISTING] Email: ${email}, Telefon: ${telefon}, Meeting Code: ${meetingCode}`);

      // Construcția mesajului de e-mail
    const emailMessage = `Rezervarea dumneavoastră cu Cristina Zurba a fost realizată.\n` +
      `Vă rugăm să accesați:\n` +
      `https://www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}\n` +
      `la data de ${formatSelectedSlot(day)} la ora ${time}.\n\n` +
      `ATENȚIE - CONDIȚII IMPORTANTE:\n` +
      `- Intrarea la consultație se face la ora exact stabilită în programare.\n` +
      `- Nu se acordă rambursări în cazul în care clientul nu se prezintă la programarea stabilită.\n\n` +
      `Dacă întâmpinați dificultăți în utilizarea platformei, ` +
      `nu ezitați să contactați echipa de dezvoltare la ` +
      `https://www.webappdynamicx.ro/contact`;

      const mailOptions = {
        from: "webdynamicx@gmail.com",
        to: email,
        subject: "Confirmare Rezervare Consultatie - Cristina Zurba",
      text: emailMessage,
      };

    // Verificare format telefon
    if (!telefon || !/^\+\d+$/.test(telefon)) {
      console.error(`❌ [EXISTING] Număr de telefon invalid: ${telefon}`);
      return;
    }

    console.log("📤 [EXISTING] Trimiterea email-ului, SMS-ului și WhatsApp-ului...");

    // Trimiterea emailului, SMS-ului și WhatsApp-ului
      return Promise.all([
        transporter.sendMail(mailOptions).then((info) => {
        console.log("✅ [EXISTING] E-mail trimis cu succes:", info);
        }),
      twilioClient.messages
            .create({
          body: emailMessage,
          from: "+15042266134",
              to: telefon,
            })
            .then((message) => {
          console.log("✅ [EXISTING] SMS trimis cu succes:", message.sid);
        }),
      twilioClient.messages
        .create({
          body: emailMessage,
          from: "whatsapp:+14155238886",
          to: `whatsapp:${telefon}`,
        })
        .then((message) => {
          console.log("✅ [EXISTING] WhatsApp trimis cu succes:", message.sid);
            }),
      ])
          .then(() => {
        console.log("🎉 [EXISTING] E-mail, SMS și WhatsApp trimise cu succes!");
          })
          .catch((error) => {
        console.error("💥 [EXISTING] Eroare la trimiterea notificărilor:", error);
          });
    });

// ===========================================
// FUNCȚII NOI (RECORDING SYSTEM)
// ===========================================

/**
 * FUNCȚIE NOUĂ: Upload unificat pentru TOATE înregistrările
 * Callable HTTPS function
 * Region: europe-west1
 * Timeout: 540 seconds (9 minutes)
 * Memory: 2GB
 */
exports.uploadLargeRecording = uploadLargeRecording;

/**
 * FUNCȚIE NOUĂ: Cleanup automat pentru înregistrări vechi
 * Scheduled function - runs daily at 2:00 AM
 * Deletes recordings older than 30 days
 */
exports.cleanupOldRecordings = cleanupOldRecordings;

// ===========================================
// LOGS PENTRU DEPLOYMENT
// ===========================================

console.log("🚀 Firebase Functions Index loaded:");
console.log("📋 EXISTING Functions: sendNotificationOnNewReservation");
console.log("🎥 NEW Functions: uploadLargeRecording, cleanupOldRecordings");
console.log("✅ All functions ready for deployment!");
