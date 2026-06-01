import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { consumeAuthReturnUrl } from "../lib/navigation";

/**
 * Redirects authenticated (non-guest) users away from login/register funnels.
 * Waits for auth bootstrap (incl. Google redirect resolution) before acting.
 */
export function useAuthFunnelRedirect(safeReturnUrl, { enabled = true } = {}) {
  const router = useRouter();
  const {
    currentUser,
    loading: authLoading,
    googleRedirectHandled,
    isGuestUser,
  } = useAuth();
  const postAuthRedirectStartedRef = useRef(false);

  const authBootstrapReady = googleRedirectHandled && !authLoading;

  useEffect(() => {
    if (!enabled || !router.isReady || !authBootstrapReady) return;
    if (postAuthRedirectStartedRef.current) return;
    if (!currentUser?.uid || currentUser.isAnonymous || isGuestUser) return;

    postAuthRedirectStartedRef.current = true;
    const targetUrl = consumeAuthReturnUrl(safeReturnUrl);
    void router.replace(targetUrl);
  }, [
    enabled,
    router,
    router.isReady,
    authBootstrapReady,
    currentUser,
    isGuestUser,
    safeReturnUrl,
  ]);

  return { authBootstrapReady };
}
