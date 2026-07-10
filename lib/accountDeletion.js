import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, getAdminStorage } from "./firebaseAdmin";
import { softDeleteAnalysesForIdentity } from "./analysisStore";
import {
  normalizeContactEmail,
  normalizeContactPhone,
} from "./recoverAnalyses";

const USERS_COLLECTION = "Users";
const PURCHASES_ROOT = "users";
const BATCH_SIZE = 450;

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildIdentityFromProfile(uid, profile = {}) {
  const phones = [
    profile.phone,
    profile.phoneNumber,
    profile.basicInfoData?.phoneNumber,
  ]
    .map(safeStr)
    .filter(Boolean);
  const emails = [profile.email, profile.basicInfoData?.email]
    .map(safeStr)
    .filter(Boolean);

  return {
    ownerUid: uid,
    phones: [...new Set(phones)],
    emails: [...new Set(emails)],
    phone: phones[0] || "",
    email: emails[0] || "",
    phoneNormalized: normalizeContactPhone(phones[0] || ""),
    emailLower: normalizeContactEmail(emails[0] || ""),
    phoneNormalizedCandidates: [
      ...new Set(phones.map(normalizeContactPhone).filter(Boolean)),
    ],
    emailLowerCandidates: [
      ...new Set(emails.map(normalizeContactEmail).filter(Boolean)),
    ],
  };
}

async function loadUserRecord(uid) {
  const db = getAdminDb();
  const directSnap = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (directSnap.exists) {
    return {
      docId: directSnap.id,
      data: directSnap.data() || {},
      ref: directSnap.ref,
    };
  }

  const querySnap = await db
    .collection(USERS_COLLECTION)
    .where("owner_uid", "==", uid)
    .limit(1)
    .get();

  if (querySnap.empty) return null;
  const docSnap = querySnap.docs[0];
  return {
    docId: docSnap.id,
    data: docSnap.data() || {},
    ref: docSnap.ref,
  };
}

async function deleteDocumentTree(docRef) {
  const subcollections = await docRef.listCollections();
  for (const subcollectionRef of subcollections) {
    const snapshot = await subcollectionRef.get();
    await Promise.all(
      snapshot.docs.map((childDoc) => deleteDocumentTree(childDoc.ref))
    );
  }
  await docRef.delete();
}

async function deleteQueryInBatches(query, label) {
  let deleted = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await query.limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = getAdminDb().batch();
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
    deleted += snapshot.size;

    if (snapshot.size < BATCH_SIZE) break;
  }

  if (deleted > 0) {
    console.info("[account.deletion] query_batch_deleted", { label, deleted });
  }
  return deleted;
}

async function deleteSubcollection(docRef, subcollectionName) {
  const subRef = docRef.collection(subcollectionName);
  return deleteQueryInBatches(subRef, `${docRef.path}/${subcollectionName}`);
}

async function cancelStripeSubscriptionIfNeeded(subscriptionId) {
  if (!subscriptionId || !process.env.STRIPE_SECRET_KEY) {
    return { canceled: false, skipped: true };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return { canceled: true, skipped: false };
  } catch (err) {
    const msg = err?.message || String(err);
    if (err?.code === "resource_missing" || /No such subscription/i.test(msg)) {
      return { canceled: false, skipped: false, alreadyGone: true };
    }
    throw err;
  }
}

async function softDeleteUserAnalyses(uid, profile) {
  const identity = buildIdentityFromProfile(uid, profile);
  try {
    return await softDeleteAnalysesForIdentity(identity);
  } catch (error) {
    if (error?.code === "missing_contact") {
      return { softDeleted: 0 };
    }
    throw error;
  }
}

async function deleteCoursePurchases(uid) {
  const db = getAdminDb();
  const userRef = db.collection(PURCHASES_ROOT).doc(uid);
  await deleteSubcollection(userRef, "purchases");
  await deleteSubcollection(userRef, "bundlePurchases");
  await userRef.delete().catch(() => undefined);
}

async function deletePurchaseEntitlements(uid) {
  const db = getAdminDb();
  await deleteQueryInBatches(
    db.collection("purchaseEntitlements").where("ownerUid", "==", uid),
    "purchaseEntitlements"
  );
}

async function deleteUserTokens(uid, expoToken) {
  const db = getAdminDb();
  await deleteQueryInBatches(
    db.collection("userTokens").where("uid", "==", uid),
    "userTokens.byUid"
  );

  const token = safeStr(expoToken);
  if (token) {
    await deleteQueryInBatches(
      db.collection("userTokens").where("token", "==", token),
      "userTokens.byToken"
    );
  }
}

async function deleteConsultationReservations(uid) {
  const db = getAdminDb();
  await deleteQueryInBatches(
    db.collection("RezervariConsultatii").where("owner_uid", "==", uid),
    "RezervariConsultatii"
  );
}

async function deleteSupportTickets(uid) {
  const db = getAdminDb();
  await deleteQueryInBatches(
    db.collection("supportTickets").where("ownerUid", "==", uid),
    "supportTickets"
  );
}

async function deletePremiumMobilePaymentSheets(uid) {
  const db = getAdminDb();
  await deleteQueryInBatches(
    db.collection("premiumMobilePaymentSheets").where("uid", "==", uid),
    "premiumMobilePaymentSheets"
  );
}

async function deleteClinicDoctors(userRef) {
  const db = getAdminDb();
  const doctorsSnap = await userRef.collection("Doctors").get();

  for (const doctorMirror of doctorsSnap.docs) {
    const doctorId = safeStr(doctorMirror.data()?.doctorId) || doctorMirror.id;
    if (!doctorId) continue;

    const doctorRef = db.collection("Doctors").doc(doctorId);
    await deleteSubcollection(doctorRef, "clinicAppointmentsUnregisteredDocCol");
    await deleteSubcollection(doctorRef, "clinicAppointmentsDocCol");
    await deleteSubcollection(doctorRef, "clinicAppointments");
    await doctorRef.delete().catch(() => undefined);
  }
}

async function deleteUserFirestoreTree(uid, userRecord) {
  const db = getAdminDb();
  const userRef = userRecord?.ref || db.collection(USERS_COLLECTION).doc(uid);

  if (userRecord) {
    await deleteClinicDoctors(userRef);
    await deleteDocumentTree(userRef);
    return;
  }

  const fallbackSnap = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (fallbackSnap.exists) {
    await deleteClinicDoctors(fallbackSnap.ref);
    await deleteDocumentTree(fallbackSnap.ref);
  }
}

async function deleteKnownStoragePaths(uid, profile = {}) {
  const storage = getAdminStorage();
  const bucket = storage.bucket();
  const prefixes = [`images/clinics/${uid}/`];
  const directFiles = [];

  const patientImg = safeStr(profile.patientImg);
  if (patientImg) {
    directFiles.push(`images/patients/${patientImg}`);
  }

  const clinicImages = Array.isArray(profile.clinicImages) ? profile.clinicImages : [];
  clinicImages.forEach((entry) => {
    const img = safeStr(entry?.img);
    if (img) directFiles.push(`images/clinics/${uid}/${img}`);
  });

  const doctorImages = Array.isArray(profile.doctorImages) ? profile.doctorImages : [];
  doctorImages.forEach((img) => {
    const normalized = safeStr(img);
    if (normalized) directFiles.push(`images/clinics/${uid}/doctors/${normalized}`);
  });

  for (const prefix of prefixes) {
    try {
      await bucket.deleteFiles({ prefix, force: true });
      console.info("[account.deletion] storage_prefix_deleted", { prefix });
    } catch (error) {
      console.warn("[account.deletion] storage_prefix_failed", {
        prefix,
        message: error?.message || "unknown_error",
      });
    }
  }

  for (const filePath of directFiles) {
    try {
      await bucket.file(filePath).delete({ ignoreNotFound: true });
    } catch (error) {
      console.warn("[account.deletion] storage_file_failed", {
        filePath,
        message: error?.message || "unknown_error",
      });
    }
  }
}

async function deleteAuthUser(uid) {
  try {
    await getAdminAuth().deleteUser(uid);
    return { deleted: true };
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return { deleted: false, alreadyGone: true };
    }
    throw error;
  }
}

export async function purgeUserAccount(uid) {
  const normalizedUid = safeStr(uid);
  if (!normalizedUid) {
    throw new Error("Missing uid for account deletion");
  }

  const summary = {
    uid: normalizedUid,
    stripe: null,
    analysesSoftDeleted: 0,
    authDeleted: false,
  };

  console.info("[account.deletion] start", { uid: normalizedUid });

  const userRecord = await loadUserRecord(normalizedUid);
  const profile = userRecord?.data || {};

  const stripeSubscriptionId = safeStr(
    profile.stripeSubscriptionId || profile.stripe_subscription_id
  );
  if (stripeSubscriptionId) {
    summary.stripe = await cancelStripeSubscriptionIfNeeded(stripeSubscriptionId);
  }

  const analysisResult = await softDeleteUserAnalyses(normalizedUid, profile);
  summary.analysesSoftDeleted = analysisResult.softDeleted || 0;

  await deleteCoursePurchases(normalizedUid);
  await deletePurchaseEntitlements(normalizedUid);
  await deleteUserTokens(normalizedUid, profile.expoToken);
  await deleteConsultationReservations(normalizedUid);
  await deleteSupportTickets(normalizedUid);
  await deletePremiumMobilePaymentSheets(normalizedUid);
  await deleteUserFirestoreTree(normalizedUid, userRecord);
  await deleteKnownStoragePaths(normalizedUid, profile);

  const authResult = await deleteAuthUser(normalizedUid);
  summary.authDeleted = authResult.deleted === true;

  console.info("[account.deletion] complete", summary);
  return summary;
}
