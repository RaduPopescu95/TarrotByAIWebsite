import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { authentication } from "../firebase";
import { persistAuthReturnUrl } from "../lib/navigation";

const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
]);

function buildProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function shouldFallbackToRedirect(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return false;
  }
  if (POPUP_FALLBACK_CODES.has(code)) return true;
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return message.includes("popup blocked") || message.includes("operation-not-supported");
}

export async function signInWithGooglePopupOrRedirect(
  auth = authentication,
  { returnUrl = "/" } = {}
) {
  const provider = buildProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    return {
      status: "signed_in",
      method: "popup",
      result,
      user: result?.user || null,
    };
  } catch (error) {
    if (shouldFallbackToRedirect(error)) {
      if (typeof window !== "undefined" && returnUrl) {
        persistAuthReturnUrl(returnUrl);
      }
      await signInWithRedirect(auth, provider);
      return {
        status: "redirecting",
        method: "redirect",
        result: null,
        user: null,
      };
    }
    throw error;
  }
}

export async function resolveGoogleRedirectResult(auth = authentication) {
  const result = await getRedirectResult(auth);
  if (!result) {
    return {
      status: "empty",
      method: "redirect",
      result: null,
      user: null,
    };
  }

  return {
    status: "signed_in",
    method: "redirect",
    result,
    user: result?.user || null,
  };
}
