const REQUEST_TYPES = new Set(["delete", "access", "rectify"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanText = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const validatePrivacyRequest = (body = {}) => {
  const email = cleanText(body.email, 254).toLowerCase();
  const requestType = cleanText(body.requestType, 24);
  const message = cleanText(body.message, 2000);
  const company = cleanText(body.company, 200);

  if (company) return { ok: false, code: "honeypot" };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, code: "email" };
  if (!REQUEST_TYPES.has(requestType)) return { ok: false, code: "requestType" };

  return { ok: true, value: { email, requestType, message } };
};

export const createPrivacyRequestRateLimiter = ({
  maxRequests = 3,
  windowMs = 15 * 60 * 1000,
  now = () => Date.now(),
} = {}) => {
  const attemptsByClient = new Map();

  return (clientKey) => {
    const currentTime = now();
    const attempts = (attemptsByClient.get(clientKey) || []).filter(
      (timestamp) => currentTime - timestamp < windowMs
    );

    if (attempts.length >= maxRequests) {
      attemptsByClient.set(clientKey, attempts);
      return false;
    }

    attempts.push(currentTime);
    attemptsByClient.set(clientKey, attempts);
    return true;
  };
};

export const privacyRequestLabels = {
  delete: "Account and associated data deletion",
  access: "Access to personal data",
  rectify: "Personal data correction",
};
