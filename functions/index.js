const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Twilio = require("twilio");
const moment = require("moment"); // Importă moment.js pentru a formata datele

// Configurații Twilio
const aS = "ACb9114100eebb62117f46ff7e2b13a81f";
const aT = "44bfa2c95890eb3356b0ef996bd06466";
const client = new Twilio(aS, aT);

// Configurații pentru Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "webdynamicx@gmail.com",
    pass: "nnbf ezyh jgnx hlxv",
  },
});

// Inițializează Firebase Admin SDK
admin.initializeApp();

// Funcție pentru a formata data slotului selectat
const formatSelectedSlot = (selectedSlotDay) => {
  console.log("selectedSlotDay....", selectedSlotDay);
  const [monthIndex, day] = selectedSlotDay.split("-").map(Number);
  const currentYear = moment().year(); // Obține anul curent folosind moment
  const correctMonth = monthIndex + 1;

  // Creează un obiect moment folosind anul curent, luna și ziua
  const formattedDate = moment(
      `${currentYear}-${correctMonth}-${day}`,
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
      let telefon = newReservation.telefon;
      const meetingCode = newReservation.meetingCode;
      const day = newReservation.selectedSlot.day;
      const year = newReservation.selectedSlot.currentYear;
      const time = newReservation.selectedSlot.slot;
      const documentId = context.params.documentId;

      console.log(
          `Email: ${email}, Telefon: ${telefon}, Meeting Code: ${meetingCode}`,
      );
      console.log(
          `Data programării: ${day}-${year}, 
          Ora: ${time}, 
          Document ID: ${documentId}`,
      );

      // Asigură-te că este în formatul corect E.164
      if (telefon && !telefon.startsWith("+")) {
      // Dacă numărul nu începe cu "+", adaugă codul de țară
        telefon = "+40" + telefon.replace(/^0+/, ""); // Elimină 0-ul
        console.log(`Numărul de telefon formatat: ${telefon}`);
      }

      // Construcția mesajului de e-mail
      const emailMessage = `
      Rezervarea dumneavoastră cu Cristina Zurba a fost realizată.
      Vă rugăm să accesați
      www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}
      la data de ${formatSelectedSlot(day)} la ora ${time}.
    `;

      // Construcția mesajului de SMS
      const smsMessage = `
      Rezervarea dumneavoastră cu Cristina Zurba a fost realizată.
      Vă rugăm să accesați
      www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}
      la data de ${formatSelectedSlot(day)} la ora ${time}.
    `;

      // Trimiterea e-mailului
      const mailOptions = {
        from: "webdynamicx@gmail.com",
        to: email,
        subject: "Confirmare Rezervare Consultatie - Cristina Zurba",
        text: emailMessage,
      };

      console.log("Opțiunile de email:", mailOptions);

      // Verificare format telefon (dacă începe cu "+", e valid pentru Twilio)
      if (!telefon || !/^\+\d+$/.test(telefon)) {
        console.error(`Număr de telefon invalid: ${telefon}`);
        return;
      }

      console.log("Trimiterea email-ului și SMS-ului...");

      // Trimiterea emailului și a SMS-ului folosind promisiuni
      return Promise.all([
        transporter.sendMail(mailOptions).then((info) => {
          console.log("E-mail trimis cu succes:", info);
        }),
        client.messages
            .create({
              body: smsMessage,
              from: "+12096466216", // Număr Twilio valid
              to: telefon,
            })
            .then((message) => {
              console.log("SMS trimis cu succes:", message.sid);
            }),
      ])
          .then(() => {
            console.log("E-mail și SMS trimise cu succes!");
          })
          .catch((error) => {
            console.error("Eroare la trimiterea notificărilor:", error);
          });
    });
