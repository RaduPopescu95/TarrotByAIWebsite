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
