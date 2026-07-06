/**
 * Trigger local test for sendNotificationOnNewReservation via Firestore emulator.
 *
 * Usage (emulator must be running):
 *   cd next-js
 *   firebase emulators:start --only functions,firestore --project tarrot-590ee
 *
 * Then in another terminal:
 *   TEST_EMAIL=you@example.com TEST_PHONE=+40721234567 node functions/scripts/trigger-sendNotificationOnNewReservation.js
 *
 * Options:
 *   EMAIL_ONLY=1  — skip SMS/WhatsApp by using invalid phone (email still blocked by current logic!)
 *   Note: current function blocks ALL sends if phone invalid. Use valid TEST_PHONE for full test.
 */

const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID || "tarrot-590ee";
const testEmail = process.env.TEST_EMAIL || "webdynamicx@gmail.com";
const testPhone = process.env.TEST_PHONE || "+40721234567";
const documentId = `test-${Date.now()}`;

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = projectId;

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

const testReservation = {
  nume: "Test Client",
  email: testEmail,
  telefon: testPhone,
  meetingCode: "00000000-0000-4000-8000-000000000001",
  selectedSlot: {
    day: "6-25",
    slot: "14:00",
    currentYear: new Date().getFullYear(),
  },
  tipConsultatie: "TEST",
  session_id: `test_session_${Date.now()}`,
  meetingActive: false,
  _testRun: true,
  createdAt: new Date().toISOString(),
};

async function main() {
  console.log("🧪 Trigger test sendNotificationOnNewReservation");
  console.log(`   Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`   Document ID: ${documentId}`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Telefon: ${testPhone}`);
  console.log("");
  console.log("⏳ Creating RezervariConsultatii document (onCreate should fire)...");

  await db.collection("RezervariConsultatii").doc(documentId).set(testReservation);

  console.log("✅ Document created. Check the emulator terminal for function logs.");
  console.log("   Look for: ✅ E-mail trimis cu succes OR ❌ errors");
  console.log("");
  console.log("   Emulator UI: http://127.0.0.1:4000");
}

main().catch((err) => {
  console.error("💥 Trigger failed:", err.message);
  process.exit(1);
});
