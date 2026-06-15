import { getAdminDb } from "./firebaseAdmin";
import {
  PRODUCT_CODES,
  buildEmailQueryCandidates,
  buildPhoneQueryCandidates,
  normalizeContactEmail,
  normalizeContactPhone,
  resolveAnalysisFamily,
} from "./recoverAnalyses";

const ANALYSIS_COLLECTIONS = {
  personal: "analizeAstrogramaNatalaPersonala",
  astrogramaOthers: "analizeAstrogramaNatalaOthers",
  sinastrieOnePerson: "analizeSinastrieOnePerson",
  sinastrieOthers: "analizeSinastrieOthers",
};

// Firestore `in` accepts up to 30 values on the Admin SDK; we keep <=10.
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const runQuery = async (queryRef, label) => {
  try {
    const snapshot = await queryRef.get();
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error(`[recover] query failed: ${label}`, {
      message: error?.message || String(error),
    });
    return [];
  }
};

const uniqueTrimmed = (values) => {
  const seen = new Set();
  const out = [];
  (values || []).forEach((value) => {
    const t = String(value || "").trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  });
  return out;
};

// Returns raw docs (deduped by Firestore doc id) for one analysis collection,
// queried across every plausible phone/email format AND across every known
// contact (current + previous). Excludes superseded docs.
const loadCollectionByContact = async (db, collectionName, { phones, emails }) => {
  const colRef = db.collection(collectionName);
  const tasks = [];

  phones.forEach((phone, pIdx) => {
    const phoneCandidates = buildPhoneQueryCandidates(phone);
    chunk(phoneCandidates, 10).forEach((group, idx) => {
      if (group.length === 1) {
        tasks.push(
          runQuery(
            colRef.where("phone", "==", group[0]),
            `${collectionName}.phone[${pIdx}.${idx}]`
          )
        );
      } else if (group.length > 1) {
        tasks.push(
          runQuery(
            colRef.where("phone", "in", group),
            `${collectionName}.phone_in[${pIdx}.${idx}]`
          )
        );
      }
    });

    const normalizedPhone = normalizeContactPhone(phone);
    if (normalizedPhone) {
      tasks.push(
        runQuery(
          colRef.where("phoneNormalized", "==", normalizedPhone),
          `${collectionName}.phoneNormalized[${pIdx}]`
        )
      );
    }
  });

  emails.forEach((email, eIdx) => {
    const emailCandidates = buildEmailQueryCandidates(email);
    if (emailCandidates.length === 1) {
      tasks.push(
        runQuery(
          colRef.where("email", "==", emailCandidates[0]),
          `${collectionName}.email[${eIdx}]`
        )
      );
    } else if (emailCandidates.length > 1) {
      tasks.push(
        runQuery(
          colRef.where("email", "in", emailCandidates),
          `${collectionName}.email_in[${eIdx}]`
        )
      );
    }

    const emailLower = normalizeContactEmail(email);
    if (emailLower) {
      tasks.push(
        runQuery(
          colRef.where("emailLower", "==", emailLower),
          `${collectionName}.emailLower[${eIdx}]`
        )
      );
    }
  });

  if (!tasks.length) {
    return [];
  }

  const results = await Promise.all(tasks);
  const byDocId = new Map();
  results.flat().forEach((docData) => {
    if (docData && docData.id && docData.isActive !== false) {
      byDocId.set(docData.id, docData);
    }
  });

  return Array.from(byDocId.values());
};

// Mirrors getPurchaseEntitlementsByContact: reads purchaseEntitlements by
// customer.emailLower / customer.phoneNormalized / customer.phone, across every
// known contact (current + previous).
const loadEntitlementsByContact = async (db, { phones, emails }) => {
  const colRef = db.collection("purchaseEntitlements");
  const tasks = [];

  phones.forEach((phone, pIdx) => {
    const normalizedPhone = normalizeContactPhone(phone);
    if (normalizedPhone) {
      tasks.push(
        runQuery(
          colRef.where("customer.phoneNormalized", "==", normalizedPhone),
          `entitlements.phoneNormalized[${pIdx}]`
        )
      );
    }
    const rawPhone = String(phone || "").trim();
    if (rawPhone) {
      tasks.push(
        runQuery(
          colRef.where("customer.phone", "==", rawPhone),
          `entitlements.phone[${pIdx}]`
        )
      );
    }
  });

  emails.forEach((email, eIdx) => {
    const normalizedEmail = normalizeContactEmail(email);
    if (normalizedEmail) {
      tasks.push(
        runQuery(
          colRef.where("customer.emailLower", "==", normalizedEmail),
          `entitlements.emailLower[${eIdx}]`
        )
      );
    }
  });

  if (!tasks.length) {
    return [];
  }

  const results = await Promise.all(tasks);
  const byDocId = new Map();
  results.flat().forEach((docData) => {
    if (docData && docData.id) {
      byDocId.set(docData.id, docData);
    }
  });

  return Array.from(byDocId.values());
};

/**
 * Loads, dedups and entitlement-resolves all analysis families for a contact.
 * Accepts both the single form ({phone, email}) and the multi form
 * ({phones, emails}) so it can search across current + previous contacts.
 * @param {{phone?: string, email?: string, phones?: string[], emails?: string[]}} contact
 * @return {Promise<{personal: object[], astrogramaOthers: object[], sinastrieOnePerson: object[], sinastrieOthers: object[], entitlements: object[]}>}
 */
export async function loadAnalysesByContact({
  phone,
  email,
  phones,
  emails,
} = {}) {
  const phoneList = uniqueTrimmed([...(phones || []), phone]);
  const emailList = uniqueTrimmed([...(emails || []), email]);

  if (!phoneList.length && !emailList.length) {
    return {
      personal: [],
      astrogramaOthers: [],
      sinastrieOnePerson: [],
      sinastrieOthers: [],
      entitlements: [],
    };
  }

  const db = getAdminDb();
  const contact = { phones: phoneList, emails: emailList };

  const [
    personalDocs,
    astrogramaOthersDocs,
    sinastrieOnePersonDocs,
    sinastrieOthersDocs,
    entitlements,
  ] = await Promise.all([
    loadCollectionByContact(db, ANALYSIS_COLLECTIONS.personal, contact),
    loadCollectionByContact(db, ANALYSIS_COLLECTIONS.astrogramaOthers, contact),
    loadCollectionByContact(db, ANALYSIS_COLLECTIONS.sinastrieOnePerson, contact),
    loadCollectionByContact(db, ANALYSIS_COLLECTIONS.sinastrieOthers, contact),
    loadEntitlementsByContact(db, contact),
  ]);

  return {
    personal: resolveAnalysisFamily(personalDocs, entitlements, {
      productCode: PRODUCT_CODES.astrogramaPersonal,
    }),
    astrogramaOthers: resolveAnalysisFamily(astrogramaOthersDocs, entitlements, {
      productCode: PRODUCT_CODES.astrogramaOthers,
    }),
    sinastrieOnePerson: resolveAnalysisFamily(sinastrieOnePersonDocs, entitlements, {
      productCode: PRODUCT_CODES.sinastrieOnePerson,
    }),
    sinastrieOthers: resolveAnalysisFamily(sinastrieOthersDocs, entitlements, {
      productCode: PRODUCT_CODES.sinastrieOthers,
    }),
    entitlements,
  };
}
