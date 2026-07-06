/**
 * Test local: aceeași logică ca sendNotificationOnNewReservation (email + SMS + WhatsApp).
 * Nu necesită emulator Firebase — rulează direct handler-ul din index.js.
 *
 * Usage:
 *   cd next-js/functions
 *   TEST_EMAIL=you@example.com TEST_PHONE=+40721234567 node scripts/run-sendNotificationOnNewReservation-local.js
 *
 * SMS_ONLY=0 EMAIL_ONLY=1  — trimite doar email (telefon invalid intenționat)
 *   ATENȚIE: funcția curentă blochează email dacă telefon invalid!
 *   Pentru email-only trebuie telefon valid; SMS/WhatsApp pot eșua separat.
 */

const path = require("path");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "tarrot-590ee";

const testEmail = process.env.TEST_EMAIL || "webdynamicx@gmail.com";
const testPhone = process.env.TEST_PHONE || "+40721234567";
const documentId = `local-test-${Date.now()}`;

const reservation = {
  email: testEmail,
  telefon: testPhone,
  meetingCode: "00000000-0000-4000-8000-000000000001",
  selectedSlot: {
    day: "6-25",
    slot: "14:00",
  },
};

const snap = {
  data: () => reservation,
};

const context = {
  params: { documentId },
};

async function main() {
  console.log("🧪 Rulare locală sendNotificationOnNewReservation");
  console.log(`   Email: ${testEmail}`);
  console.log(`   Telefon: ${testPhone}`);
  console.log(`   Document ID: ${documentId}`);
  console.log("");

  const { sendNotificationOnNewReservation } = require(path.join(__dirname, "..", "index.js"));

  const handler = sendNotificationOnNewReservation.run || sendNotificationOnNewReservation;

  if (typeof handler !== "function") {
    throw new Error(
      "Nu am găsit handler-ul. Exportul Firebase trebuie să fie functions.firestore...onCreate"
    );
  }

  const result = await handler(snap, context);
  console.log("");
  console.log("🏁 Handler finalizat.", result !== undefined ? `Return: ${result}` : "");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("💥 Eroare:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });
