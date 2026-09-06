import nodemailer from "nodemailer";
import COMPANY_LEGAL from "../../data/companyLegal";
import {
  createPrivacyRequestRateLimiter,
  privacyRequestLabels,
  validatePrivacyRequest,
} from "../../lib/privacyRequest";

const canAcceptRequest = createPrivacyRequestRateLimiter();

const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  return String(forwardedIp || req.socket?.remoteAddress || "unknown").trim();
};

const createTransporter = () =>
  nodemailer.createTransport({
    service: process.env.PRIVACY_SMTP_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validation = validatePrivacyRequest(req.body);
  if (!validation.ok && validation.code === "honeypot") {
    return res.status(202).json({ ok: true });
  }
  if (!validation.ok) {
    return res.status(400).json({ error: "Please complete the required fields." });
  }
  if (!canAcceptRequest(getClientKey(req))) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[privacy-requests] Email service is not configured");
    return res.status(503).json({ error: "The request service is temporarily unavailable." });
  }

  const { email, requestType, message } = validation.value;
  const requestLabel = privacyRequestLabels[requestType];
  const recipient = process.env.PRIVACY_REQUEST_EMAIL || COMPANY_LEGAL.supportEmail;
  const transporter = createTransporter();
  const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br />") : "No additional details.";
  const from = `"Cristina Zurba Privacy" <${process.env.EMAIL_USER}>`;
  const results = await Promise.allSettled([
    transporter.sendMail({ from, to: recipient, replyTo: email, subject: `[Privacy request] ${requestLabel}`, text: `Request type: ${requestLabel}\nEmail: ${email}\n\nDetails:\n${message || "No additional details."}`, html: `<h1>Privacy request</h1><p><strong>Request type:</strong> ${escapeHtml(requestLabel)}</p><p><strong>Account email:</strong> ${escapeHtml(email)}</p><p><strong>Details:</strong><br />${safeMessage}</p>` }),
    transporter.sendMail({ from, to: email, subject: "We received your privacy request | Cristina Zurba", text: `We received your request for: ${requestLabel}. We will verify account ownership before taking action and respond within 30 days.`, html: `<p>We received your request for: <strong>${escapeHtml(requestLabel)}</strong>.</p><p>We will verify account ownership before taking action and respond within 30 days.</p>` }),
  ]);

  if (results[0].status === "rejected") {
    console.error("[privacy-requests] Support notification failed", results[0].reason);
    return res.status(502).json({ error: "We could not send your request. Please try again later." });
  }
  if (results[1].status === "rejected") {
    console.warn("[privacy-requests] Confirmation email failed", results[1].reason);
  }
  return res.status(202).json({ ok: true });
}
