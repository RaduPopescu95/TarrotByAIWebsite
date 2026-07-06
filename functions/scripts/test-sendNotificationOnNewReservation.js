/**
 * Test local sendNotificationOnNewReservation — raportează email / SMS / WhatsApp separat.
 *
 * cd next-js/functions
 * TEST_EMAIL=you@example.com TEST_PHONE=+40721234567 node scripts/test-sendNotificationOnNewReservation.js
 */

const buffer = require("buffer");
if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer;
}

const moment = require("moment");
const nodemailer = require("nodemailer");
const Twilio = require("twilio");

const testEmail = process.env.TEST_EMAIL || "webdynamicx@gmail.com";
const testPhone = process.env.TEST_PHONE || "+40721234567";
const documentId = `local-test-${Date.now()}`;

const reservation = {
  email: testEmail,
  telefon: testPhone,
  meetingCode: "00000000-0000-4000-8000-000000000001",
  selectedSlot: { day: "6-25", slot: "14:00" },
};

const formatSelectedSlot = (selectedSlotDay) => {
  const [monthIndex, day] = selectedSlotDay.split("-").map(Number);
  const currentYear = moment().year();
  const correctMonth = monthIndex + 1;
  return moment(`${currentYear}-${correctMonth}-${day}`, "YYYY-MM-DD").format("DD-MM-YYYY");
};

async function main() {
  // Same config as functions/index.js (keep in sync after deploy edits)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "webdynamicx@gmail.com",
      pass: "rpocvvzavzvkebak",
    },
  });

  const twilioClient = new Twilio(
    "AC6cf01717a74bbf7cc02d4a723db53232",
    "8c6b979039e8d0fb5aa878dcc2eefac6"
  );

  const { email, telefon, meetingCode, selectedSlot } = reservation;
  const day = selectedSlot.day;
  const time = selectedSlot.slot;

  console.log("🧪 Test sendNotificationOnNewReservation (local, fără emulator)");
  console.log(`   Email: ${email}`);
  console.log(`   Telefon: ${telefon}`);
  console.log(`   Doc ID: ${documentId}`);
  console.log("");

  if (!telefon || !/^\+\d+$/.test(telefon)) {
    console.error(`❌ Telefon invalid — funcția s-ar opri aici: "${telefon}"`);
    console.error("   Folosește TEST_PHONE=+407xxxxxxxx (format E.164)");
    process.exit(1);
  }

  const emailMessage =
    `Rezervarea dumneavoastră cu Cristina Zurba a fost realizată.\n` +
    `Vă rugăm să accesați:\n` +
    `https://www.cristinazurba.com/meeting?meetingCode=${meetingCode}__${documentId}\n` +
    `la data de ${formatSelectedSlot(day)} la ora ${time}.\n\n` +
    `[TEST local din terminal]`;

  const mailOptions = {
    from: "webdynamicx@gmail.com",
    to: email,
    subject: "[TEST] Confirmare Rezervare Consultatie - Cristina Zurba",
    text: emailMessage,
  };

  console.log("📧 Trimit email...");
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email trimis:", info.messageId);
  } catch (err) {
    console.error("❌ Email eșuat:", err.message);
  }

  console.log("📱 Trimit SMS...");
  try {
    const sms = await twilioClient.messages.create({
      body: emailMessage,
      from: "+15042266134",
      to: telefon,
    });
    console.log("✅ SMS trimis:", sms.sid);
  } catch (err) {
    console.error("❌ SMS eșuat:", err.message, err.code ? `(code ${err.code})` : "");
  }

  console.log("💬 Trimit WhatsApp...");
  try {
    const wa = await twilioClient.messages.create({
      body: emailMessage,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${telefon}`,
    });
    console.log("✅ WhatsApp trimis:", wa.sid);
  } catch (err) {
    console.error("❌ WhatsApp eșuat:", err.message, err.code ? `(code ${err.code})` : "");
  }
}

main().catch((err) => {
  console.error("💥", err.message);
  process.exit(1);
});
