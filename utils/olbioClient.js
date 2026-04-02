import {
  buildInvoiceDecision,
  buildOblioClientFromNormalized,
  logBillingAudit,
  normalizeBillingContext,
} from "./billingAudit.mjs";

let OBLIO_TOKEN_CACHE = {
  accessToken: "",
  expiresAtMs: 0,
};

function isTruthyEnv(val) {
  if (typeof val !== "string") return false;
  return ["1", "true", "yes", "y", "on"].includes(val.trim().toLowerCase());
}

function getSellerVatConfig(sessionMetadata) {
  const sellerVatPayer = isTruthyEnv(process.env.OBLIO_SELLER_VAT_PAYER || process.env.OBLIO_VAT_PAYER);
  const envDefaultVat =
    process.env.OBLIO_DEFAULT_VAT_RATE ??
    process.env.OLBIO_DEFAULT_VAT_RATE ??
    "19";

  if (!sellerVatPayer) {
    return { sellerVatPayer: false, vatPercentage: 0, vatIncluded: 0, vatName: "Neplatitor" };
  }

  const metaVat =
    typeof sessionMetadata?.vatRate !== "undefined" ? Number(sessionMetadata.vatRate) : undefined;
  const vatPercentage = Number.isFinite(metaVat) ? metaVat : Number(envDefaultVat);
  return {
    sellerVatPayer: true,
    vatPercentage: Number.isFinite(vatPercentage) ? vatPercentage : 19,
    vatIncluded: 1,
    vatName: "Normala",
  };
}

async function oblioAuthenticate() {
  const email = process.env.OBLIO_EMAIL || "";
  const secret = process.env.OBLIO_SECRET || "";
  if (!email || !secret) {
    throw new Error("Missing OBLIO_CLIENT_ID/OBLIO_CLIENT_SECRET (or OBLIO_EMAIL/OBLIO_SECRET)");
  }
  if (OBLIO_TOKEN_CACHE.accessToken && Date.now() < OBLIO_TOKEN_CACHE.expiresAtMs) {
    return OBLIO_TOKEN_CACHE.accessToken;
  }
  const authUrl =
    process.env.OBLIO_AUTH_URL || "https://www.oblio.eu/api/authorize/token";
  const form = new URLSearchParams({
    client_id: email,
    client_secret: secret,
  });
  const resp = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Oblio auth failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  const token = data.access_token;
  const expiresInSec = Number(data.expires_in || 0);
  OBLIO_TOKEN_CACHE.accessToken = token;
  OBLIO_TOKEN_CACHE.expiresAtMs = Date.now() + Math.max(0, expiresInSec - 60) * 1000;
  return token;
}

function buildAuditInput({ session, rezervareData, participant }) {
  const metadata = session?.metadata || {};
  return {
    billingType: metadata.buyerType,
    companyName: metadata.buyerCompanyName,
    cif: metadata.buyerCif,
    cnp: metadata.buyerCnp,
    reg: metadata.buyerRegCom,
    address: metadata.buyerStreet || rezervareData?.adresaClient || participant?.billingAddress || "",
    state: metadata.buyerCounty || participant?.billingCounty || "",
    city: metadata.buyerCity || participant?.billingCity || "",
    country: metadata.buyerCountry || participant?.billingCountry || "",
    postalCode: metadata.buyerPostalCode || "",
    contact:
      metadata.buyerContactName ||
      rezervareData?.nume ||
      participant?.nume ||
      session?.customer_details?.name ||
      "",
    name:
      metadata.buyerType === "company"
        ? metadata.buyerCompanyName || ""
        : rezervareData?.nume || participant?.nume || session?.customer_details?.name || "",
    email:
      metadata.buyerEmail ||
      rezervareData?.email ||
      participant?.email ||
      session?.customer_details?.email ||
      session?.customer_email ||
      "",
    phone:
      metadata.buyerPhone ||
      rezervareData?.telefon ||
      participant?.telefon ||
      session?.customer_details?.phone ||
      "",
  };
}

function buildInvoicePayload({
  type,
  rezervareData,
  session,
  conferinta,
  participant,
  normalizedClient,
  invoiceDecision,
}) {
  const oblioCif = process.env.OBLIO_CIF || "";
  const oblioSeriesName = process.env.OBLIO_SERIES || "FCT";
  const metadata = session?.metadata || {};
  const vatCfg = getSellerVatConfig(metadata);
  const grossAmountRaw =
    typeof session?.amount_total === "number"
      ? session.amount_total / 100
      : rezervareData?.costConsultatie
      ? Number(rezervareData.costConsultatie)
      : 0;
  const grossAmount = Math.round((Number(grossAmountRaw) || 0) * 100) / 100;
  const categorieName =
    rezervareData?.categorie?.about ||
    rezervareData?.categorie?.name ||
    rezervareData?.categorie?.title ||
    "Consultație";
  const tipConsultatieLabel = rezervareData?.tipConsultatie ? String(rezervareData.tipConsultatie) : "";
  const itemName =
    type === "conferinta"
      ? `Consultație tip conferință pentru ${conferinta?.titlu || "Conferință"}`
      : `Consultație pentru ${categorieName}${tipConsultatieLabel ? ` (${tipConsultatieLabel})` : ""}`;
  const issueDate = new Date().toISOString().split("T")[0];

  return {
    cif: oblioCif,
    client: buildOblioClientFromNormalized(normalizedClient),
    issueDate,
    seriesName: oblioSeriesName,
    language: "RO",
    precision: 2,
    currency: "RON",
    sendEmail: 1,
    sendEInvoice: invoiceDecision.sendEInvoice ? 1 : 0,
    products: [
      {
        name: itemName,
        description: "",
        price: grossAmount,
        measuringUnit: metadata.measureUnit || "bucată",
        vatName: vatCfg.vatName,
        vatPercentage: vatCfg.vatPercentage,
        vatIncluded: vatCfg.vatIncluded,
        quantity: 1,
        productType: "Serviciu",
      },
    ],
    mentions:
      type === "conferinta"
        ? `Factură generată automat pentru conferință. Stripe session: ${session?.id || ""}`
        : `Factură generată automat pentru consultatie. Stripe session: ${session?.id || ""}`,
    internalNote:
      type === "conferinta"
        ? `Conferinta: ${conferinta?.titlu || ""} | Stripe Payment | eInvoice=${invoiceDecision.sendEInvoice ? "1" : "0"}`
        : `MeetingCode: ${rezervareData?.meetingCode || ""} | Stripe Payment | eInvoice=${invoiceDecision.sendEInvoice ? "1" : "0"}`,
    collect: {
      type: "Card",
      documentNumber: `STRIPE-${session?.id || rezervareData?.session_id || ""}`,
      value: grossAmount,
      issueDate,
      mentions: "Plată procesată prin Stripe",
    },
  };
}

export async function createOlbioInvoice({ type, rezervareData, session, conferinta, participant }) {
  try {
    const oblioCif = process.env.OBLIO_CIF || "";
    const apiBase =
      (process.env.OBLIO_API_BASE_URL || "https://www.oblio.eu").replace(/\/+$/, "");

    if (!oblioCif) {
      console.log("[OBLIO] Skipping invoice: missing OBLIO_CIF");
      return null;
    }

    const billingAudit = normalizeBillingContext(buildAuditInput({ session, rezervareData, participant }), {
      defaultCountry: "Romania",
    });
    const invoiceDecision = buildInvoiceDecision(billingAudit);
    logBillingAudit({
      flow: type === "conferinta" ? "conference" : "consultation",
      stage: "pre_oblio_build",
      sessionId: session?.id || null,
      raw: billingAudit.raw,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
    });
    if (!invoiceDecision.emitInvoice) {
      logBillingAudit({
        flow: type === "conferinta" ? "conference" : "consultation",
        stage: "pre_oblio_blocked",
        sessionId: session?.id || null,
        normalized: billingAudit.normalizedClient,
        decision: invoiceDecision,
        error: invoiceDecision.blockedReason,
      });
      return {
        blocked: true,
        audit: {
          raw: billingAudit.raw,
          normalizedClient: billingAudit.normalizedClient,
          validation: billingAudit.validation,
          invoiceDecision,
        },
      };
    }

    const invoicePayload = buildInvoicePayload({
      type,
      rezervareData,
      session,
      conferinta,
      participant,
      normalizedClient: billingAudit.normalizedClient,
      invoiceDecision,
    });
    logBillingAudit({
      flow: type === "conferinta" ? "conference" : "consultation",
      stage: "oblio_payload",
      sessionId: session?.id || null,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
      oblioPayload: invoicePayload,
    });

    const token = await oblioAuthenticate();
    const resp = await fetch(`${apiBase}/api/docs/invoice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      logBillingAudit({
        flow: type === "conferinta" ? "conference" : "consultation",
        stage: "oblio_response_error",
        sessionId: session?.id || null,
        normalized: billingAudit.normalizedClient,
        decision: invoiceDecision,
        oblioPayload: invoicePayload,
        error: `${resp.status} ${txt}`,
      });
      return {
        status: resp.status,
        errorText: txt,
        audit: {
          raw: billingAudit.raw,
          normalizedClient: billingAudit.normalizedClient,
          validation: billingAudit.validation,
          invoiceDecision,
          finalOblioPayload: invoicePayload,
        },
      };
    }
    const result = await resp.json().catch(() => ({}));
    logBillingAudit({
      flow: type === "conferinta" ? "conference" : "consultation",
      stage: "oblio_response_ok",
      sessionId: session?.id || null,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
      oblioPayload: invoicePayload,
      oblioResponse: result,
    });
    return {
      ...result,
      audit: {
        raw: billingAudit.raw,
        normalizedClient: billingAudit.normalizedClient,
        validation: billingAudit.validation,
        invoiceDecision,
        finalOblioPayload: invoicePayload,
        oblioResponse: result,
      },
    };
  } catch (err) {
    console.error("[OBLIO] Unexpected error creating invoice:", err?.message || err);
    return null;
  }
}

export async function createOlbioInvoiceFromPayload({ invoicePayload, requestId }) {
  try {
    const apiBase =
      (process.env.OBLIO_API_BASE_URL || "https://www.oblio.eu").replace(/\/+$/, "");
    const token = await oblioAuthenticate();

    console.log(`[OBLIO] [${requestId || "no_requestId"}] POST /api/docs/invoice`);
    console.log(
      `[OBLIO] [${requestId || "no_requestId"}] Payload:`,
      JSON.stringify(invoicePayload, null, 2)
    );

    const resp = await fetch(`${apiBase}/api/docs/invoice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    });

    const text = await resp.text().catch(() => "");
    if (!resp.ok) {
      console.error(
        `[OBLIO] [${requestId || "no_requestId"}] Invoice API error:`,
        resp.status,
        text
      );
      return { status: resp.status, data: null, errorText: text };
    }

    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.warn(
          `[OBLIO] [${requestId || "no_requestId"}] Response not JSON, returning raw text`
        );
        data = { raw: text };
      }
    }
    console.log(`[OBLIO] [${requestId || "no_requestId"}] Invoice created:`, data);
    return { status: resp.status, data };
  } catch (err) {
    console.error(
      `[OBLIO] [${requestId || "no_requestId"}] Unexpected error:`,
      err?.message || err
    );
    return { status: 0, data: null, errorText: String(err?.message || err) };
  }
}
