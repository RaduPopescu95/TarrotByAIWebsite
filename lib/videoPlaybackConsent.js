import { useCallback, useEffect, useRef, useState } from "react";
import { getFirebaseBearerHeader } from "../utils/firebaseAuthHeaders";
import {
  VIDEO_PLAYBACK_TERMS_VERSION,
} from "./videoPlaybackConsentConstants";

const CONSENT_API_PATH = "/api/video-playback/consent";
const SESSION_STORAGE_KEY = "videoPlaybackConsentSessionId";

export function buildSessionAcceptedStorageKey(
  sessionId,
  termsVersion = VIDEO_PLAYBACK_TERMS_VERSION
) {
  return `videoConsentAccepted:${termsVersion}:${sessionId}`;
}

export function getOrCreateVideoConsentSessionId() {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function isVideoConsentSessionAccepted(sessionId) {
  if (typeof window === "undefined" || !sessionId) {
    return false;
  }
  try {
    return Boolean(
      window.sessionStorage.getItem(buildSessionAcceptedStorageKey(sessionId))
    );
  } catch {
    return false;
  }
}

export function markVideoConsentSessionAccepted(sessionId) {
  if (typeof window === "undefined" || !sessionId) {
    return;
  }
  try {
    window.sessionStorage.setItem(
      buildSessionAcceptedStorageKey(sessionId),
      String(Date.now())
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {object} payload
 * @param {{ displayName?: string, guestEmail?: string, deviceToken?: string }} [identity]
 */
export async function recordVideoPlaybackConsent(payload, identity = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(await getFirebaseBearerHeader({ required: false })),
  };

  const response = await fetch(CONSENT_API_PATH, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...payload,
      ...identity,
      termsVersion: VIDEO_PLAYBACK_TERMS_VERSION,
      source: "web",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "consent_record_failed");
  }
  return data;
}

export function resolveLibraryPlatform(video) {
  const platform = video?.platform;
  if (platform === "bunny" || platform === "vimeo" || platform === "youtube") {
    return platform;
  }
  return "youtube";
}

/**
 * Gate dedicated video players: one accept modal per browser session, view logged each time.
 * @param {{ onDecline?: () => void, userData?: object }} [options]
 */
export function useVideoPlaybackConsentGate(options = {}) {
  const sessionIdRef = useRef("");
  const [state, setState] = useState({
    consentGranted: false,
    modalVisible: false,
    recording: false,
    pending: null,
  });

  useEffect(() => {
    sessionIdRef.current = getOrCreateVideoConsentSessionId();
  }, []);

  const resolveIdentityFields = useCallback(() => {
    const userData = options.userData || {};
    const displayName =
      typeof userData.first_name === "string" ? userData.first_name.trim() : "";
    const guestEmail =
      typeof userData.email === "string" ? userData.email.trim() : "";
    return { displayName, guestEmail, deviceToken: "" };
  }, [options.userData]);

  const postConsent = useCallback(
    async (action, req) => {
      const identity = resolveIdentityFields();
      const sessionId = sessionIdRef.current || getOrCreateVideoConsentSessionId();
      await recordVideoPlaybackConsent(
        {
          action,
          sessionId,
          ...req,
        },
        identity
      );
    },
    [resolveIdentityFields]
  );

  const grantAndLog = useCallback(
    async (req, includeAccept) => {
      setState((s) => ({ ...s, recording: true }));
      try {
        if (includeAccept) {
          await postConsent("accept", req);
          markVideoConsentSessionAccepted(sessionIdRef.current);
        }
        await postConsent("view", req);
        setState({
          consentGranted: true,
          modalVisible: false,
          recording: false,
          pending: null,
        });
      } catch {
        setState({
          consentGranted: true,
          modalVisible: false,
          recording: false,
          pending: null,
        });
      }
    },
    [postConsent]
  );

  const requestPlayback = useCallback(
    async (req) => {
      const sessionId = sessionIdRef.current || getOrCreateVideoConsentSessionId();
      sessionIdRef.current = sessionId;

      if (isVideoConsentSessionAccepted(sessionId)) {
        setState({
          consentGranted: true,
          modalVisible: false,
          recording: true,
          pending: null,
        });
        try {
          await postConsent("view", req);
        } catch {
          /* allow playback if logging fails */
        }
        setState((s) => ({ ...s, recording: false, consentGranted: true }));
        return true;
      }

      setState({
        consentGranted: false,
        modalVisible: true,
        recording: false,
        pending: req,
      });
      return false;
    },
    [postConsent]
  );

  const handleAccept = useCallback(() => {
    const req = state.pending;
    if (!req) return;
    void grantAndLog(req, true);
  }, [grantAndLog, state.pending]);

  const handleDecline = useCallback(() => {
    setState({
      consentGranted: false,
      modalVisible: false,
      recording: false,
      pending: null,
    });
    options.onDecline?.();
  }, [options.onDecline]);

  return {
    consentGranted: state.consentGranted,
    modalVisible: state.modalVisible,
    recording: state.recording,
    requestPlayback,
    handleAccept,
    handleDecline,
  };
}
