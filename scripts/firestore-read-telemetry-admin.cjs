#!/usr/bin/env node

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const uid = readArg("--uid");
const enabledRaw = readArg("--enabled");
if (!uid || !["true", "false"].includes(enabledRaw)) {
  console.error("Usage: node scripts/firestore-read-telemetry-admin.cjs --uid <uid> --enabled <true|false>");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function main() {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims || {}),
    firestoreReadTelemetry: enabledRaw === "true",
  });
  console.log(`firestoreReadTelemetry=${enabledRaw} set for ${uid}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
