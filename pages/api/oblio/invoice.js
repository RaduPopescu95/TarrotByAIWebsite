import Stripe from "stripe";
import { createOlbioInvoiceFromPayload } from "../../../utils/olbioClient";
import { handleQueryFirestore, handleUpdateFirestore } from "../../../utils/firestoreUtils";
import {
  buildInvoiceDecision,
  buildOblioClientFromNormalized,
  logBillingAudit,
  normalizeBillingContext,
} from "../../../utils/billingAudit.mjs";
import { getOblioVatSettings, resolveExclusiveOblioTax, shouldSendOblioEInvoice } from "../../../utils/oblioTax";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getBearerToken(req) {
  const header = req.headers?.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function toNumber(val, fallback = 0) {
  const parsed = typeof val === "string" ? Number(val) : val;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundTo(val, decimals = 2) {
  const number = toNumber(val, 0);
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
}

export default async function handler(req, res) {
  const requestId =
    (req.body && req.body.requestId) ||
    `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", requestId });
  }

  try {
    const secret =
      process.env.INVOICE_SHARED_SECRET ||
      process.env.NEXT_OBLIO_INVOICE_SHARED_SECRET ||
      "";
    const token = getBearerToken(req);
    if (!secret) {
      console.error(
        `[OBLIO_API] [${requestId}] Missing INVOICE_SHARED_SECRET (or NEXT_OBLIO_INVOICE_SHARED_SECRET)`
      );
      return res.status(500).json({ error: "Server not configured", requestId });
    }
    if (!token || token !== secret) {
      console.warn(`[OBLIO_API] [${requestId}] Unauthorized request`);
      return res.status(401).json({ error: "Unauthorized", requestId });
    }

    const { transactionId, customer, productCode, invoice, meta } = req.body || {};

    if (!transactionId || typeof transactionId !== "string") {
      return res.status(400).json({ error: "Missing transactionId", requestId });
    }
    if (!customer || typeof customer !== "object") {
      return res.status(400).json({ error: "Missing customer", requestId });
    }
    if (!productCode || typeof productCode !== "string") {
      return res.status(400).json({ error: "Missing productCode", requestId });
    }

    const billingAudit = normalizeBillingContext(
      {
        billingType: customer?.billingType,
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        name: customer?.name,
        companyName: customer?.company?.name || customer?.company?.company,
        cif: customer?.company?.vat || customer?.company?.cif || customer?.company?.companyVAT,
        cnp: customer?.cnp,
        reg: customer?.company?.reg || customer?.company?.rc || customer?.company?.companyReg,
        address:
          customer?.billingType === "corporate"
            ? customer?.company?.address || customer?.company?.companyAddress
            : customer?.address?.line1,
        state: customer?.address?.state || customer?.address?.stateCounty,
        city: customer?.address?.city,
        country: customer?.address?.country,
        postalCode: customer?.address?.postal_code || customer?.address?.postalCode,
        contact: customer?.contact || `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
        email: customer?.email,
        phone: customer?.phone,
      },
      { defaultCountry: "Romania" }
    );
    const invoiceDecision = buildInvoiceDecision(billingAudit);
    logBillingAudit({
      flow: "mobile",
      stage: "api_checkout_received",
      requestId,
      raw: customer,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
    });
    if (!billingAudit.validation.ok) {
      return res.status(400).json({
        error: "Invalid billing details",
        requestId,
        details: billingAudit.validation.blockingErrors,
      });
    }

    const existingArr = await handleQueryFirestore("OblioInvoices", "transactionId", transactionId);
    const existing = Array.isArray(existingArr) ? existingArr[0] : null;
    if (existing) {
      if (existing.status === "created" && existing.oblio?.seriesName && existing.oblio?.number) {
        return res.status(200).json({
          requestId,
          transactionId,
          oblio: existing.oblio,
        });
      }
      if (existing.status === "processing" && existing.requestId && existing.requestId !== requestId) {
        return res.status(202).json({
          requestId,
          transactionId,
          status: "processing",
        });
      }
    }

    const pi = await stripe.paymentIntents.retrieve(transactionId);
    const piStatus = pi?.status;
    const piCurrency = (pi?.currency || "").toLowerCase();
    const piAmount = typeof pi?.amount_received === "number" ? pi.amount_received : pi?.amount;
    const amountCents = Math.round(toNumber(piAmount, 0));

    if (piStatus !== "succeeded") {
      return res.status(400).json({ error: "Payment not succeeded", requestId, stripe: { status: piStatus } });
    }
    if (piCurrency !== "ron") {
      return res.status(400).json({ error: "Invalid currency", requestId, stripe: { currency: piCurrency } });
    }

    try {
      await handleUpdateFirestore(`OblioInvoices/${transactionId}`, {
        transactionId,
        requestId,
        status: "processing",
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn(`[OBLIO_API] [${requestId}] Failed to mark processing:`, error?.message || error);
    }

    const oblioCif = process.env.OBLIO_CIF || process.env.OBLIO_COMPANY_CIF || "";
    const oblioSeries = process.env.OBLIO_SERIES || "";
    if (!oblioCif || !oblioSeries) {
      return res.status(500).json({
        error: "Oblio not configured",
        requestId,
        details: { hasCif: !!oblioCif, hasSeries: !!oblioSeries },
      });
    }

    const issueDate = invoice?.issueDate || todayISO();
    const language = invoice?.language || "RO";
    const currency = invoice?.currency || "RON";
    const precision = typeof invoice?.precision === "number" ? invoice.precision : 2;
    const sendEmail = invoice?.sendEmail === false ? 0 : 1;
    const taxLine = resolveExclusiveOblioTax({
      totalCents: amountCents,
      subtotalCents: Number(pi?.metadata?.oblioNetAmountCents),
      taxCents: Number(pi?.metadata?.oblioTaxAmountCents),
      settings: getOblioVatSettings(),
    });
    if (!taxLine.ok) {
      console.error(`[OBLIO_API] [${requestId}] blocked_total_mismatch`, { transactionId, reason: taxLine.reason, totalCents: amountCents });
      return res.status(409).json({ error: "Stripe tax breakdown missing or inconsistent", requestId, transactionId });
    }

    const productMap = {
      astrogama_natala: {
        name: "Analiză Astrogramă Natală",
        description: "Serviciu digital - analiză astrogramă natală",
      },
      astrogama_natala_other_person: {
        name: "Analiză Astrogramă Natală (altă persoană)",
        description: "Serviciu digital - analiză astrogramă natală pentru altă persoană",
      },
      sinastrie_relatie: {
        name: "Analiză Sinastrie Relație",
        description: "Serviciu digital - analiză sinastrie relație",
      },
      sinastrie_relatie_others: {
        name: "Analiză Sinastrie Relație (others)",
        description: "Serviciu digital - analiză sinastrie relație (others)",
      },
    };
    const mapped = productMap[productCode] || {
      name: meta?.feature || "Serviciu digital",
      description: `Serviciu digital (${productCode})`,
    };

    const oblioPayload = {
      cif: oblioCif,
      client: buildOblioClientFromNormalized(billingAudit.normalizedClient),
      issueDate,
      seriesName: oblioSeries,
      language,
      precision,
      currency,
      sendEmail,
      sendEInvoice: invoiceDecision.sendEInvoice && shouldSendOblioEInvoice() ? 1 : 0,
      products: [
        {
          name: mapped.name,
          description: mapped.description,
          price: taxLine.price,
          measuringUnit: "bucată",
          vatName: taxLine.vatName,
          vatPercentage: taxLine.vatPercentage,
          vatIncluded: taxLine.vatIncluded,
          quantity: 1,
          productType: "Serviciu",
        },
      ],
      mentions: `Factura generată automat (mobile). Stripe PI: ${transactionId}.`,
      internalNote: `transactionId:${transactionId} requestId:${requestId} productCode:${productCode} eInvoice=${invoiceDecision.sendEInvoice ? "1" : "0"}`,
      collect: {
        type: "Card",
        documentNumber: `STRIPE-${transactionId}`,
        value: taxLine.total,
        issueDate,
        mentions: "Plată procesată prin Stripe",
      },
    };

    logBillingAudit({
      flow: "mobile",
      stage: "oblio_payload",
      requestId,
      transactionId,
      normalized: billingAudit.normalizedClient,
      decision: invoiceDecision,
      oblioPayload,
    });

    const oblioResp = await createOlbioInvoiceFromPayload({
      invoicePayload: oblioPayload,
      requestId,
    });

    if (!oblioResp || oblioResp.status !== 200 || !oblioResp.data) {
      await handleUpdateFirestore(`OblioInvoices/${transactionId}`, {
        transactionId,
        requestId,
        status: "failed",
        updatedAt: new Date().toISOString(),
        stripe: {
          amount: taxLine.total,
          currency: piCurrency,
          customerEmail: billingAudit.normalizedClient.email,
          status: piStatus,
        },
        oblio: {
          raw: oblioResp || null,
          finalOblioPayload: oblioPayload,
          normalizedClient: billingAudit.normalizedClient,
          invoiceDecision,
        },
      });

      return res.status(502).json({
        error: "Oblio invoice failed",
        requestId,
        transactionId,
      });
    }

    const result = {
      seriesName: oblioResp.data.seriesName,
      number: oblioResp.data.number,
      link: oblioResp.data.link,
      total: taxLine.total,
      currency: "RON",
    };

    await handleUpdateFirestore(`OblioInvoices/${transactionId}`, {
      transactionId,
      requestId,
      status: "created",
      updatedAt: new Date().toISOString(),
      stripe: {
        amount: taxLine.total,
        currency: piCurrency,
        customerEmail: billingAudit.normalizedClient.email,
        status: piStatus,
      },
      oblio: {
        ...result,
        finalOblioPayload: oblioPayload,
        rawCustomer: customer,
        normalizedClient: billingAudit.normalizedClient,
        invoiceDecision,
      },
    });

    return res.status(200).json({
      requestId,
      transactionId,
      oblio: result,
    });
  } catch (err) {
    console.error(`[OBLIO_API] [${requestId}] Unexpected error:`, err?.message || err);
    return res.status(500).json({ error: "Internal server error", requestId });
  }
}
