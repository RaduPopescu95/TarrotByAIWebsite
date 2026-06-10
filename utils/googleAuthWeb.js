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

let googleRedirectResultPromise = null;

function buildProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function isGoogleSignedInUser(user) {
  if (!user || user.isAnonymous || !Array.isArray(user.providerData)) return false;
  return user.providerData.some((provider) => provider?.providerId === "google.com");
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

export async function startGoogleRedirectSignIn(auth = authentication, { returnUrl = "/" } = {}) {
  if (typeof window !== "undefined" && returnUrl) {
    persistAuthReturnUrl(returnUrl);
  }
  console.log("🔄 [GOOGLE_AUTH] Starting redirect sign-in", {
    returnUrl,
    origin: typeof window !== "undefined" ? window.location.origin : "server",
    href: typeof window !== "undefined" ? window.location.href : "server",
  });
  await signInWithRedirect(auth, buildProvider());
}

export async function signInWithGooglePopupOrRedirect(
  auth = authentication,
  { returnUrl = "/" } = {}
) {
  const provider = buildProvider();

  try {
    console.log("🔄 [GOOGLE_AUTH] Attempting popup sign-in");
    const result = await signInWithPopup(auth, provider);
    console.log("✅ [GOOGLE_AUTH] Popup sign-in succeeded", {
      uid: result?.user?.uid || null,
      email: result?.user?.email || null,
    });
    return {
      status: "signed_in",
      method: "popup",
      result,
      user: result?.user || null,
    };
  } catch (error) {
    console.warn("⚠️ [GOOGLE_AUTH] Popup sign-in failed", {
      code: error?.code || "unknown_code",
      message: error?.message || "unknown_error",
    });
    if (shouldFallbackToRedirect(error)) {
      console.log("🔄 [GOOGLE_AUTH] Falling back to redirect sign-in");
      await startGoogleRedirectSignIn(auth, { returnUrl });
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

/**
 * Must run exactly once per full page load (Firebase allows a single getRedirectResult).
 */
export function resolvePendingGoogleRedirectResult(auth = authentication) {
  if (typeof window === "undefined") {
    return Promise.resolve({
      status: "empty",
      method: "redirect",
      result: null,
      user: null,
    });
  }

  if (!googleRedirectResultPromise) {
    googleRedirectResultPromise = (async () => {
      console.log("🔄 [GOOGLE_AUTH] Resolving redirect result", {
        href: window.location.href,
        hasPendingAuthParams:
          window.location.hash.includes("apiKey=") ||
          window.location.search.includes("apiKey="),
      });

      await auth.authStateReady();
      let redirectError = null;
      let result = null;

      try {
        result = await getRedirectResult(auth);
      } catch (error) {
        redirectError = error;
        console.error("❌ [GOOGLE_AUTH] getRedirectResult threw", {
          code: error?.code || "unknown_code",
          message: error?.message || "unknown_error",
        });
      }

      const user =
        result?.user ||
        (isGoogleSignedInUser(auth.currentUser) ? auth.currentUser : null);

      console.log("🔄 [GOOGLE_AUTH] Redirect result resolved", {
        hasResultUser: Boolean(result?.user),
        hasCurrentUser: Boolean(auth.currentUser),
        resolvedUid: user?.uid || null,
        resolvedEmail: user?.email || null,
        credentialProvider: result?.providerId || null,
        redirectErrorCode: redirectError?.code || null,
      });

      if (!user) {
        return {
          status: "empty",
          method: "redirect",
          result: null,
          user: null,
          error: redirectError,
        };
      }

      return {
        status: "signed_in",
        method: "redirect",
        result,
        user,
        error: redirectError,
      };
    })();
  }

  return googleRedirectResultPromise;
}

/** @deprecated Use resolvePendingGoogleRedirectResult */
export async function resolveGoogleRedirectResult(auth = authentication) {
  return resolvePendingGoogleRedirectResult(auth);
}
