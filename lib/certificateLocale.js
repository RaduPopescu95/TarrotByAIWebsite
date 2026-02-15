import { normalizeLocale } from "./courses";

const CERTIFICATE_COPY = {
  ro: {
    title: "Certificat de finalizare",
    subtitle: "Acest document atestă finalizarea cu succes a cursului.",
    awardedTo: "Se acordă lui",
    forCourse: "Pentru finalizarea cursului",
    issuedOn: "Data emiterii",
    issuer: "Emis de",
    certificateId: "ID certificat",
  },
  en: {
    title: "Certificate of Completion",
    subtitle: "This document certifies the successful completion of the course.",
    awardedTo: "Awarded to",
    forCourse: "For completing the course",
    issuedOn: "Issued on",
    issuer: "Issued by",
    certificateId: "Certificate ID",
  },
};

export function resolveCertificateLocale(locale) {
  const normalized = normalizeLocale(locale, "en");
  return normalized === "ro" ? "ro" : "en";
}

export function getCertificateLocaleCopy(locale) {
  const localeCode = resolveCertificateLocale(locale);
  return CERTIFICATE_COPY[localeCode] || CERTIFICATE_COPY.en;
}
