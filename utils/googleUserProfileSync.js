import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeWhitespace(value) {
  return toSafeString(value).replace(/\s+/g, " ");
}

function splitEmailLocalPart(email) {
  const normalizedEmail = normalizeWhitespace(email);
  if (!normalizedEmail.includes("@")) return "";
  return normalizedEmail.split("@")[0] || "";
}

export function deriveNameParts({ displayName, email }) {
  const normalizedDisplayName = normalizeWhitespace(displayName);
  if (normalizedDisplayName) {
    const parts = normalizedDisplayName.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "User" };
    }
    return {
      firstName: parts.slice(0, -1).join(" ") || parts[0],
      lastName: parts[parts.length - 1] || "User",
    };
  }

  const localPart = splitEmailLocalPart(email);
  if (localPart) {
    const cleaned = localPart.replace(/[._-]+/g, " ").trim();
    const parts = cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "User" };
    }
    if (parts.length > 1) {
      return {
        firstName: parts.slice(0, -1).join(" "),
        lastName: parts[parts.length - 1],
      };
    }
  }

  return { firstName: "Google", lastName: "User" };
}

export function resolveMobileCompatibleRole(userDoc) {
  if (!userDoc || typeof userDoc !== "object") return "patient";
  if (
    userDoc.isClinic === true ||
    Boolean(userDoc.clinicInfoData) ||
    Boolean(userDoc.clinicAddressLocation)
  ) {
    return "clinic";
  }
  return "patient";
}

export async function upsertGoogleUserProfile(user) {
  if (!user?.uid) {
    throw new Error("Google user uid is required for profile sync");
  }

  const uid = String(user.uid).trim();
  const userRef = doc(db, "Users", uid);
  const userSnap = await getDoc(userRef);
  const existing = userSnap.exists() ? userSnap.data() || {} : {};
  const { firstName, lastName } = deriveNameParts({
    displayName: user.displayName,
    email: user.email,
  });

  // New Google users: same document shape as expo-mobile-app sign-in/register.
  if (!userSnap.exists()) {
    const newUserProfile = {
      owner_uid: uid,
      first_name: firstName,
      last_name: lastName,
      email: toSafeString(user.email) || "",
      photoURL: toSafeString(user.photoURL) || "",
      auth_provider: "Google",
    };
    await setDoc(userRef, newUserProfile);
    return {
      created: true,
      updatedFields: Object.keys(newUserProfile),
      user: newUserProfile,
      role: resolveMobileCompatibleRole(newUserProfile),
    };
  }

  const patch = {
    owner_uid: uid,
    auth_provider: "Google",
  };
  const updatedFields = [];

  if (existing.owner_uid !== uid) {
    updatedFields.push("owner_uid");
  }
  if (existing.auth_provider !== "Google") {
    updatedFields.push("auth_provider");
  }
  if (!toSafeString(existing.first_name) && toSafeString(firstName)) {
    patch.first_name = firstName;
    updatedFields.push("first_name");
  }
  if (!toSafeString(existing.last_name) && toSafeString(lastName)) {
    patch.last_name = lastName;
    updatedFields.push("last_name");
  }
  if (!toSafeString(existing.email) && toSafeString(user.email)) {
    patch.email = user.email.trim();
    updatedFields.push("email");
  }
  if (!toSafeString(existing.photoURL) && toSafeString(user.photoURL)) {
    patch.photoURL = user.photoURL.trim();
    updatedFields.push("photoURL");
  }

  await setDoc(userRef, patch, { merge: true });

  const merged = { ...existing, ...patch };
  return {
    created: !userSnap.exists(),
    updatedFields,
    user: merged,
    role: resolveMobileCompatibleRole(merged),
  };
}
