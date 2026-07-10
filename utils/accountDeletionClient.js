import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { authentication } from "../firebase";
import { getFirebaseBearerHeader } from "./firebaseAuthHeaders";

function hasProvider(user, providerId) {
  return Array.isArray(user?.providerData)
    ? user.providerData.some((provider) => provider?.providerId === providerId)
    : false;
}

export function userRequiresPasswordForDeletion(user) {
  return hasProvider(user, "password");
}

export function userCanReauthWithGoogle(user) {
  return hasProvider(user, "google.com");
}

export async function reauthenticateForAccountDeletion(currentPassword = "") {
  const user = authentication.currentUser;
  if (!user) {
    const error = new Error("Authentication required");
    error.code = "auth/missing-user";
    throw error;
  }

  if (userRequiresPasswordForDeletion(user)) {
    const password = typeof currentPassword === "string" ? currentPassword.trim() : "";
    if (!password) {
      const error = new Error("Current password is required");
      error.code = "auth/missing-password";
      throw error;
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return { method: "password" };
  }

  if (userCanReauthWithGoogle(user)) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "login" });
    const result = await reauthenticateWithPopup(user, provider);
    return { method: "google", user: result.user };
  }

  const error = new Error("Unsupported authentication provider for account deletion");
  error.code = "auth/unsupported-provider";
  throw error;
}

export async function deleteAccountViaApi() {
  const headers = await getFirebaseBearerHeader({ required: true, forceRefresh: true });
  const response = await fetch("/api/account", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || "Failed to delete account");
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

export async function deleteAccountWithReauth(currentPassword = "") {
  await reauthenticateForAccountDeletion(currentPassword);
  return deleteAccountViaApi();
}
