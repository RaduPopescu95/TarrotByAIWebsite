import { useEffect, useState } from "react";

function evaluateTcfConsent(tcData) {
  const purposeConsents = tcData?.purpose?.consents || {};
  return Boolean(purposeConsents["1"]);
}

function readConsentFromTcfApi() {
  if (typeof window === "undefined" || typeof window.__tcfapi !== "function") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let hasResolved = false;
    const timeout = window.setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(null);
      }
    }, 800);

    window.__tcfapi("getTCData", 2, (tcData, success) => {
      if (hasResolved) return;
      hasResolved = true;
      window.clearTimeout(timeout);

      if (!success || !tcData) {
        resolve(false);
        return;
      }

      resolve(evaluateTcfConsent(tcData));
    });
  });
}

export default function useAdsConsent(consentRequired = true, cmpExpected = false) {
  const [hasConsent, setHasConsent] = useState(!consentRequired);
  const [resolved, setResolved] = useState(!consentRequired);

  useEffect(() => {
    let active = true;
    let timerId;
    let attempts = 0;
    const maxAttempts = 24;
    let tcfListenerId = null;

    if (!consentRequired) {
      setHasConsent(true);
      setResolved(true);
      return undefined;
    }

    if (!cmpExpected) {
      setHasConsent(false);
      setResolved(true);
      return undefined;
    }

    const handleTcData = (tcData, success) => {
      if (!active) return;
      if (!success || !tcData) return;

      const consentValue = evaluateTcfConsent(tcData);
      setHasConsent(consentValue);
      setResolved(true);
    };

    const attachTcfListener = () => {
      if (typeof window === "undefined" || typeof window.__tcfapi !== "function") {
        return false;
      }

      window.__tcfapi("addEventListener", 2, (tcData, success) => {
        if (!active || !success || !tcData) return;

        if (typeof tcData.listenerId !== "undefined" && tcData.listenerId !== null) {
          tcfListenerId = tcData.listenerId;
        }

        handleTcData(tcData, success);
      });

      return true;
    };

    const pollConsent = async () => {
      attachTcfListener();

      const consentValue = await readConsentFromTcfApi();
      if (!active) return;

      if (typeof consentValue === "boolean") {
        setHasConsent(consentValue);
        setResolved(true);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        setHasConsent(false);
        setResolved(true);
        return;
      }

      timerId = window.setTimeout(pollConsent, 500);
    };

    pollConsent();

    return () => {
      active = false;
      if (timerId) window.clearTimeout(timerId);
      if (
        tcfListenerId !== null &&
        typeof window !== "undefined" &&
        typeof window.__tcfapi === "function"
      ) {
        window.__tcfapi("removeEventListener", 2, () => {}, tcfListenerId);
      }
    };
  }, [consentRequired, cmpExpected]);

  return { hasConsent, resolved };
}
