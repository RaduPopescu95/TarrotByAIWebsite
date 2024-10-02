const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Configurații Twilio
const accountSid = "TWILIO_ACCOUNT_SID"; // Înlocuiește cu SID-ul tău
const authToken = "TWILIO_AUTH_TOKEN"; // Înlocuiește cu Auth Token-ul tău
const client = new twilio(accountSid, authToken);

// Configurații pentru Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com", // Înlocuiește cu adresa ta de email
    pass: "Timewatch132021", // Înlocuiește cu parola emailului tău
  },
});

// Inițializează Firebase Admin SDK
admin.initializeApp();

exports.sendNotificationOnNewReservation = functions.firestore
    .document("RezervariConsultatii/{documentId}")
    .onCreate((snap, context) => {
      const newReservation = snap.data();

      // Extrage datele din documentul nou creat
      const email = newReservation.email;
      const telefon = newReservation.telefon;
      const meetingCode = newReservation.meetingCode;
      const day = newReservation.selectedSlot.day;
      const year = newReservation.selectedSlot.currentYear;
      const time = newReservation.selectedSlot.slot;
      const documentId = context.params.documentId;

      // Construcția mesajului de e-mail
      const emailMessage = `
      Rezervarea voastră cu Cristin Zurba a fost realizată.
      Vă rugăm să accesați\n
      www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}
      la data de ${day}-${year} la ora ${time}.
    `;

      // Construcția mesajului de SMS
      const smsMessage = `
      Rezervarea voastră cu Cristin Zurba a fost realizată.
      Vă rugăm să accesați\n
      www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}
      la data de ${day}-${year} la ora ${time}.
  `;

      // Trimiterea e-mailului
      const mailOptions = {
        from: "webdynamicx@gmail.com",
        to: email,
        subject: "Confirmare Rezervare Consultatie - Cristin Zurba",
        text: emailMessage,
      };

      // Trimiterea emailului și a SMS-ului folosind promisiuni
      return Promise.all([
        transporter.sendMail(mailOptions),
        client.messages.create({
          body: smsMessage,
          from: "+1234567890",
          to: telefon,
        }),
      ])
          .then(() => {
            console.log("E-mail și SMS trimise cu succes!");
          })
          .catch((error) => {
            console.error("Eroare la trimiterea notificărilor:", error);
          });
    });
