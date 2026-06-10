import { deriveNameParts } from "../utils/googleUserProfileSync";

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function extractBillingIdentity(userData) {
  const billing = userData?.premiumBillingProfile?.billing;
  if (!billing || typeof billing !== "object") {
    return { email: "", firstName: "", lastName: "", legacyFull: "" };
  }

  return {
    email: safeStr(billing.email),
    firstName: safeStr(billing.firstName),
    lastName: safeStr(billing.lastName),
    legacyFull: safeStr(billing?.individual?.fullName),
    companyName: safeStr(billing?.company?.name || billing?.company?.companyName),
  };
}

/**
 * Fill missing Users identity fields (owner_uid, email, first_name, last_name) without overwriting existing values.
 */
export function buildUserIdentityPatch(existing, sources = {}) {
  const ex = existing || {};
  const patch = {};
  const updatedFields = [];

  const uid = safeStr(sources.uid);
  if (uid && !safeStr(ex.owner_uid)) {
    patch.owner_uid = uid;
    updatedFields.push("owner_uid");
  }

  const billing = extractBillingIdentity(ex);
  const email =
    [sources.email, sources.authEmail, billing.email].map(safeStr).find(Boolean) || "";
  if (email && !safeStr(ex.email)) {
    patch.email = email;
    updatedFields.push("email");
  }

  let firstName = safeStr(sources.firstName);
  let lastName = safeStr(sources.lastName);

  if (!firstName && billing.firstName) firstName = billing.firstName;
  if (!lastName && billing.lastName) lastName = billing.lastName;

  if ((!firstName || !lastName) && billing.legacyFull) {
    const fromLegacy = deriveNameParts({
      displayName: billing.legacyFull,
      email: email || safeStr(ex.email),
    });
    if (!firstName) firstName = fromLegacy.firstName;
    if (!lastName) lastName = fromLegacy.lastName;
  }

  if ((!firstName || !lastName) && safeStr(sources.displayName)) {
    const fromDisplay = deriveNameParts({
      displayName: sources.displayName,
      email: email || safeStr(ex.email),
    });
    if (!firstName) firstName = fromDisplay.firstName;
    if (!lastName) lastName = fromDisplay.lastName;
  }

  if ((!firstName || !lastName) && email) {
    const fromEmail = deriveNameParts({ displayName: "", email });
    if (!firstName) firstName = fromEmail.firstName;
    if (!lastName) lastName = fromEmail.lastName;
  }

  if (firstName && !safeStr(ex.first_name)) {
    patch.first_name = firstName;
    updatedFields.push("first_name");
  }
  if (lastName && !safeStr(ex.last_name)) {
    patch.last_name = lastName;
    updatedFields.push("last_name");
  }

  return { patch, updatedFields };
}

export async function resolveAuthIdentitySources(uid) {
  const normalizedUid = safeStr(uid);
  if (!normalizedUid) {
    return { uid: null, email: null, displayName: null };
  }

  try {
    const { getAdminAuth } = await import("./firebaseAdmin");
    const authUser = await getAdminAuth().getUser(normalizedUid);
    return {
      uid: normalizedUid,
      email: authUser.email || null,
      displayName: authUser.displayName || null,
    };
  } catch (err) {
    console.warn("[userIdentitySync] auth lookup failed", {
      uid: normalizedUid,
      message: err?.message || String(err),
    });
    return { uid: normalizedUid, email: null, displayName: null };
  }
}
