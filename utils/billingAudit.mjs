const CIF_CONTROL_KEY = "753217532";
const SECTOR_CITY_VALUES = new Set([
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Sector 4",
  "Sector 5",
  "Sector 6",
]);

function removeDiacritics(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function sanitizeString(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function simplifyValue(value) {
  return removeDiacritics(sanitizeString(value, 255))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getPathValue(source, path) {
  if (!source || typeof source !== "object") return undefined;
  const parts = path.split(".");
  let current = source;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

function pickFirstValue(source, paths) {
  for (const path of paths) {
    const value = getPathValue(source, path);
    if (typeof value === "string" && sanitizeString(value)) return sanitizeString(value, 500);
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value;
  }
  return "";
}

function normalizeCountryName(value) {
  const raw = sanitizeString(value, 120);
  const simplified = simplifyValue(raw);
  if (!simplified) return "";
  if (["ro", "romania"].includes(simplified)) return "Romania";
  if (["us", "usa", "united states", "united states of america"].includes(simplified)) {
    return "United States";
  }
  if (["uk", "gb", "great britain", "united kingdom"].includes(simplified)) {
    return "United Kingdom";
  }
  if (["de", "germany"].includes(simplified)) return "Germany";
  if (["fr", "france"].includes(simplified)) return "France";
  if (["it", "italy"].includes(simplified)) return "Italy";
  return raw;
}

function normalizeStateName(value) {
  const raw = sanitizeString(value, 120);
  const simplified = simplifyValue(raw);
  if (!simplified) return "";
  if (["bucuresti", "bucharest", "municipiul bucuresti", "bucuresti sector"].includes(simplified)) {
    return "Bucuresti";
  }
  if (simplified === "ilfov") return "Ilfov";
  return raw;
}

function normalizeCityName(value) {
  const raw = sanitizeString(value, 120);
  const simplified = simplifyValue(raw);
  if (!simplified) return "";
  const sectorMatch = simplified.match(/^sector\s*([1-6])$/);
  if (sectorMatch) return `Sector ${sectorMatch[1]}`;
  if (["bucuresti", "bucharest"].includes(simplified)) return "Bucuresti";
  return raw;
}

export function validateRomanianCnp(value) {
  const normalized = sanitizeString(value, 32);
  if (!normalized) {
    return { valid: false, normalized: "", reason: "CNP is required" };
  }

  return { valid: true, normalized };
}

export function validateRomanianCif(value) {
  const trimmed = sanitizeString(value, 64).toUpperCase();
  const withoutPrefix = trimmed.startsWith("RO") ? trimmed.slice(2) : trimmed;
  const digits = withoutPrefix.replace(/\D/g, "");
  if (digits.length < 2 || digits.length > 10) {
    return { valid: false, normalized: digits, reason: "CIF must have 2 to 10 digits" };
  }

  const body = digits.slice(0, -1);
  const controlDigit = Number(digits.slice(-1));
  const key = CIF_CONTROL_KEY.slice(-body.length);
  let sum = 0;
  for (let index = 0; index < body.length; index += 1) {
    sum += Number(body[index]) * Number(key[index]);
  }
  let checksum = (sum * 10) % 11;
  if (checksum === 10) checksum = 0;
  if (checksum !== controlDigit) {
    return { valid: false, normalized: digits, reason: "Invalid CIF checksum" };
  }

  return { valid: true, normalized: digits };
}

function inferBillingType(rawBillingType, companyName, cif) {
  const simplified = simplifyValue(rawBillingType);
  if (simplified === "company" || simplified === "corporate" || simplified === "firma") {
    return "corporate";
  }
  if (simplified === "person" || simplified === "individual" || simplified === "pf") {
    return "individual";
  }
  if (companyName || cif) return "corporate";
  return "individual";
}

function normalizeName(firstName, lastName, fullName) {
  const directName = sanitizeString(fullName, 240);
  if (directName) return directName;
  return [sanitizeString(firstName, 120), sanitizeString(lastName, 120)].filter(Boolean).join(" ").trim();
}

function buildError(field, message, code) {
  return { field, message, code };
}

export function normalizeBillingContext(rawInput, options = {}) {
  const individualCnpOptional = Boolean(options.individualCnpOptional);
  const raw = rawInput && typeof rawInput === "object" ? rawInput : {};
  const firstName = pickFirstValue(raw, [
    "firstName",
    "prenume",
    "customer.firstName",
    "customer.prenume",
    "participantData.prenume",
    "billingDetails.firstName",
  ]);
  const lastName = pickFirstValue(raw, [
    "lastName",
    "nume",
    "customer.lastName",
    "customer.nume",
    "participantData.nume",
    "billingDetails.lastName",
  ]);
  const fullName = pickFirstValue(raw, [
    "name",
    "buyerContactName",
    "participantName",
    "customer.name",
    "customer.fullName",
    "billingDetails.name",
  ]);
  const companyName = pickFirstValue(raw, [
    "companyName",
    "buyerCompanyName",
    "company.name",
    "customer.company.name",
    "billingDetails.company.name",
  ]);
  const cif = pickFirstValue(raw, [
    "cif",
    "buyerCif",
    "vat",
    "companyVAT",
    "company.vat",
    "company.cif",
    "customer.company.vat",
    "billingDetails.company.vat",
    "billingDetails.company.cif",
  ]);
  const cnp = pickFirstValue(raw, [
    "cnp",
    "buyerCnp",
    "customer.cnp",
    "billingDetails.cnp",
  ]);
  const reg = pickFirstValue(raw, [
    "rc",
    "reg",
    "buyerRegCom",
    "companyReg",
    "company.reg",
    "company.rc",
    "billingDetails.company.reg",
    "billingDetails.company.rc",
  ]);
  const address = pickFirstValue(raw, [
    "address",
    "line1",
    "adresa",
    "adresaClient",
    "buyerStreet",
    "companyAddress",
    "address.line1",
    "customer.address.line1",
    "billingDetails.address.line1",
    "billingDetails.company.address",
    "company.address",
  ]);
  const state = pickFirstValue(raw, [
    "state",
    "county",
    "judet",
    "buyerCounty",
    "billingCounty",
    "address.state",
    "address.county",
    "address.judet",
    "customer.address.state",
    "billingDetails.address.state",
    "billingDetails.address.county",
  ]);
  const city = pickFirstValue(raw, [
    "city",
    "oras",
    "localitate",
    "buyerCity",
    "billingCity",
    "address.city",
    "address.localitate",
    "customer.address.city",
    "billingDetails.address.city",
  ]);
  const country = pickFirstValue(raw, [
    "country",
    "tara",
    "buyerCountry",
    "billingCountry",
    "address.country",
    "address.tara",
    "customer.address.country",
    "billingDetails.address.country",
  ]);
  const postalCode = pickFirstValue(raw, [
    "postalCode",
    "postal_code",
    "zip",
    "buyerPostalCode",
    "address.postalCode",
    "address.postal_code",
    "customer.address.postalCode",
    "billingDetails.address.postalCode",
  ]);
  const email = pickFirstValue(raw, [
    "email",
    "buyerEmail",
    "customer.email",
    "participantEmail",
    "participantData.email",
    "billingDetails.email",
  ]);
  const phone = pickFirstValue(raw, [
    "phone",
    "telefon",
    "buyerPhone",
    "customer.phone",
    "participantPhone",
    "participantData.telefon",
    "billingDetails.phone",
  ]);
  const contact = pickFirstValue(raw, [
    "contact",
    "buyerContactName",
    "customer.contact",
    "billingDetails.contact",
  ]);

  const billingType = inferBillingType(
    pickFirstValue(raw, ["billingType", "buyerType", "customer.billingType", "billingDetails.billingType"]),
    companyName,
    cif
  );

  const normalizedCountry = normalizeCountryName(country || options.defaultCountry || "");
  let normalizedState = normalizeStateName(state);
  let normalizedCity = normalizeCityName(city);
  if (!normalizedState && SECTOR_CITY_VALUES.has(normalizedCity) && normalizedCountry === "Romania") {
    normalizedState = "Bucuresti";
  }
  if (normalizedState === "Bucuresti" && normalizedCity === "Bucuresti") {
    normalizedCity = "";
  }

  const name = billingType === "corporate" ? sanitizeString(companyName, 255) : normalizeName(firstName, lastName, fullName);
  const normalizedContact = sanitizeString(contact, 240) || normalizeName(firstName, lastName, fullName);

  const blockingErrors = [];
  const warnings = [];

  if (!name) {
    blockingErrors.push(buildError("name", "Numele clientului este obligatoriu.", "missing_name"));
  }
  if (!sanitizeString(address, 255)) {
    blockingErrors.push(buildError("address", "Adresa de facturare este obligatorie.", "missing_address"));
  }
  if (!normalizedCity) {
    blockingErrors.push(buildError("city", "Orașul/localitatea este obligatorie.", "missing_city"));
  }
  if (!normalizedCountry) {
    blockingErrors.push(buildError("country", "Țara este obligatorie.", "missing_country"));
  }
  if (normalizedCountry === "Romania" && !normalizedState) {
    blockingErrors.push(buildError("state", "Județul este obligatoriu pentru clienții din România.", "missing_state"));
  }
  if (normalizedState === "Bucuresti" && !SECTOR_CITY_VALUES.has(normalizedCity)) {
    blockingErrors.push(
      buildError(
        "city",
        "Pentru București, localitatea trebuie să fie unul dintre Sector 1-6.",
        "invalid_bucharest_sector"
      )
    );
  }

  let normalizedCif = "";
  let normalizedCnp = "";

  if (billingType === "corporate") {
    const cifResult = validateRomanianCif(cif);
    if (!sanitizeString(cif, 64)) {
      blockingErrors.push(buildError("cif", "CIF/CUI este obligatoriu pentru persoană juridică.", "missing_cif"));
    } else if (!cifResult.valid) {
      blockingErrors.push(buildError("cif", `CIF/CUI invalid: ${cifResult.reason}.`, "invalid_cif"));
    } else {
      normalizedCif = cifResult.normalized;
    }
  } else {
    const cnpResult = validateRomanianCnp(cnp);
    if (individualCnpOptional) {
      if (sanitizeString(cnp, 32)) {
        if (!cnpResult.valid) {
          blockingErrors.push(buildError("cnp", `CNP invalid: ${cnpResult.reason}.`, "invalid_cnp"));
        } else {
          normalizedCnp = cnpResult.normalized;
        }
      }
    } else if (!sanitizeString(cnp, 32)) {
      blockingErrors.push(buildError("cnp", "CNP este obligatoriu pentru persoană fizică.", "missing_cnp"));
    } else if (!cnpResult.valid) {
      blockingErrors.push(buildError("cnp", `CNP invalid: ${cnpResult.reason}.`, "invalid_cnp"));
    } else {
      normalizedCnp = cnpResult.normalized;
    }
  }

  if (!email) {
    warnings.push("Email-ul clientului lipsește.");
  }
  if (!phone) {
    warnings.push("Telefonul clientului lipsește.");
  }
  if (normalizedCountry && !["Romania", "United States", "United Kingdom", "Germany", "France", "Italy"].includes(normalizedCountry)) {
    warnings.push(`Țara '${normalizedCountry}' nu are alias explicit, a fost păstrată ca atare.`);
  }

  const deliveryInRomania = normalizedCountry === "Romania";
  const validation = {
    ok: blockingErrors.length === 0,
    blockingErrors,
    warnings,
    errorsByField: blockingErrors.reduce((acc, item) => {
      acc[item.field] = item.message;
      return acc;
    }, {}),
  };

  const normalizedClient = {
    billingType,
    name,
    cifOrCnp: billingType === "corporate" ? normalizedCif : normalizedCnp,
    cif: normalizedCif,
    cnp: normalizedCnp,
    rc: sanitizeString(reg, 64),
    address: sanitizeString(address, 255),
    state: normalizedState,
    city: normalizedCity,
    country: normalizedCountry,
    postalCode: sanitizeString(postalCode, 32),
    contact: normalizedContact,
    email: sanitizeString(email, 320),
    phone: sanitizeString(phone, 64),
    deliveryInRomania,
    eligibleForEInvoice:
      validation.ok &&
      deliveryInRomania &&
      (billingType === "corporate" || Boolean(normalizedCnp)),
  };

  return {
    raw,
    normalizedClient,
    validation,
  };
}

export function buildInvoiceDecision(audit) {
  const normalizedClient = audit?.normalizedClient || {};
  const validation = audit?.validation || { ok: false, blockingErrors: [] };
  return {
    emitInvoice: validation.ok,
    sendEInvoice: Boolean(normalizedClient.eligibleForEInvoice),
    blockedReason: validation.ok
      ? null
      : validation.blockingErrors.map((item) => item.message).join(" "),
  };
}

export function buildOblioClientFromNormalized(normalizedClient) {
  const base = {
    name: normalizedClient.name || "Client",
    address: normalizedClient.address || "",
    state: normalizedClient.state || "",
    city: normalizedClient.city || "",
    country: normalizedClient.country || "",
    postalCode: normalizedClient.postalCode || "",
    email: normalizedClient.email || "",
    phone: normalizedClient.phone || "",
    contact: normalizedClient.contact || "",
    save: 1,
  };

  if (normalizedClient.billingType === "corporate") {
    return {
      ...base,
      cif: normalizedClient.cif || "",
      rc: normalizedClient.rc || "",
      vatPayer: true,
    };
  }

  return {
    ...base,
    cnp: normalizedClient.cnp || "",
    vatPayer: false,
  };
}

export function logBillingAudit(payload = {}) {
  const safePayload = {
    flow: payload.flow || "unknown",
    stage: payload.stage || "unknown",
    requestId: payload.requestId || null,
    sessionId: payload.sessionId || null,
    transactionId: payload.transactionId || null,
    raw: payload.raw || null,
    normalized: payload.normalized || null,
    decision: payload.decision || null,
    oblioPayload: payload.oblioPayload || null,
    oblioResponse: payload.oblioResponse || null,
    error: payload.error || null,
  };
  console.log("[BILLING_AUDIT]", JSON.stringify(safePayload));
}

export function buildSyntheticScenarioReport({ label, audit, oblioClient, payloadInternal, verdict }) {
  return {
    scenario: label,
    inputUi: audit.raw,
    payloadInternal,
    payloadFinalOblio: oblioClient,
    verdict,
    normalizedClient: audit.normalizedClient,
    validation: audit.validation,
  };
}
