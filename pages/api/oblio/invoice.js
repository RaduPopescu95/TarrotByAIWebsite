import Stripe from "stripe";
import { createOlbioInvoiceFromPayload } from "../../../utils/olbioClient";
import { handleQueryFirestore, handleUpdateFirestore } from "../../../utils/firestoreUtils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function isTruthyEnv(val) {
  if (typeof val !== "string") return false;
  return ["1", "true", "yes", "y", "on"].includes(val.trim().toLowerCase());
}

function getSellerVatConfig() {
  const sellerVatPayer = isTruthyEnv(process.env.OBLIO_SELLER_VAT_PAYER || process.env.OBLIO_VAT_PAYER);
  const envDefaultVat =
    process.env.OBLIO_DEFAULT_VAT_RATE ??
    process.env.OLBIO_DEFAULT_VAT_RATE ??
    "19";

  if (!sellerVatPayer) {
    return { sellerVatPayer: false, vatPercentage: 0, vatIncluded: 0, vatName: "Neplatitor" };
  }

  const vatPercentage = Number(envDefaultVat);
  return {
    sellerVatPayer: true,
    vatPercentage: Number.isFinite(vatPercentage) ? vatPercentage : 19,
    vatIncluded: 1,
    vatName: "Normala"
  };
}

function getBearerToken(req) {
  const h = req.headers?.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function toNumber(val, fallback = 0) {
  const n = typeof val === "string" ? Number(val) : val;
  return Number.isFinite(n) ? n : fallback;
}

function roundTo(val, decimals = 2) {
  const n = toNumber(val, 0);
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
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
    // 1) Auth
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

    // 2) Validate payload
    const {
      transactionId,
      customer,
      productCode,
      invoice,
      meta
    } = req.body || {};

    if (!transactionId || typeof transactionId !== "string") {
      return res.status(400).json({ error: "Missing transactionId", requestId });
    }
    if (!customer || typeof customer !== "object") {
      return res.status(400).json({ error: "Missing customer", requestId });
    }
    if (!productCode || typeof productCode !== "string") {
      return res.status(400).json({ error: "Missing productCode", requestId });
    }

    const firstName = customer?.firstName || "";
    const lastName = customer?.lastName || "";
    const email = customer?.email || "";
    const phone = customer?.phone || "";
    const billingType =
      customer?.billingType ||
      (customer?.company ? "corporate" : "individual"); // optional
    const company = customer?.company || {};
    const addr = customer?.address || {};
    const line1 = addr?.line1 || "";
    const city = addr?.city || "";
    const state = addr?.state || addr?.stateCounty || "";
    const postalCode = addr?.postal_code || addr?.postalCode || "";
    const country = addr?.country || "";

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        error: "Missing customer identity fields",
        requestId,
        details: { firstName: !!firstName, lastName: !!lastName, email: !!email, phone: !!phone }
      });
    }
    if (!line1 || !city || !state || !postalCode || !country) {
      return res.status(400).json({
        error: "Missing customer address fields",
        requestId,
        details: { line1: !!line1, city: !!city, state: !!state, postalCode: !!postalCode, country: !!country }
      });
    }

    // Optional corporate validation
    if (billingType === "corporate") {
      const companyName = company?.name || company?.company || "";
      const companyVAT = company?.vat || company?.cif || company?.companyVAT || "";
      const companyAddress = company?.address || company?.companyAddress || "";
      if (!companyName || !companyVAT || !companyAddress) {
        return res.status(400).json({
          error: "Missing corporate billing fields",
          requestId,
          details: { companyName: !!companyName, companyVAT: !!companyVAT, companyAddress: !!companyAddress }
        });
      }
    }

    // 3) Idempotency: return existing invoice if present
    // Using query by field for compatibility with existing Firestore helper API.
    const existingArr = await handleQueryFirestore("OblioInvoices", "transactionId", transactionId);
    const existing = Array.isArray(existingArr) ? existingArr[0] : null;
    if (existing) {
      if (existing.status === "created" && existing.oblio?.seriesName && existing.oblio?.number) {
        console.log(`[OBLIO_API] [${requestId}] Idempotency hit for ${transactionId}`);
        return res.status(200).json({
          requestId,
          transactionId,
          oblio: existing.oblio
        });
      }
      // If another request is already processing this transactionId, ask client to retry later
      if (existing.status === "processing" && existing.requestId && existing.requestId !== requestId) {
        console.log(`[OBLIO_API] [${requestId}] Already processing ${transactionId} (requestId=${existing.requestId})`);
        return res.status(202).json({
          requestId,
          transactionId,
          status: "processing"
        });
      }
    }

    // 4) Stripe verification
    console.log(`[OBLIO_API] [${requestId}] Retrieving Stripe PaymentIntent ${transactionId}`);
    const pi = await stripe.paymentIntents.retrieve(transactionId);
    const piStatus = pi?.status;
    const piCurrency = (pi?.currency || "").toLowerCase();
    const piAmount = typeof pi?.amount_received === "number" ? pi.amount_received : pi?.amount;
    const amountRON = roundTo(Math.round(toNumber(piAmount, 0)) / 100, 2);

    console.log(`[OBLIO_API] [${requestId}] Stripe status=${piStatus} currency=${piCurrency} amount=${amountRON}`);

    if (piStatus !== "succeeded") {
      return res.status(400).json({ error: "Payment not succeeded", requestId, stripe: { status: piStatus } });
    }
    if (piCurrency !== "ron") {
      return res.status(400).json({ error: "Invalid currency", requestId, stripe: { currency: piCurrency } });
    }

    // Mark processing (best-effort lock) to reduce duplicate invoices
    try {
      await handleUpdateFirestore(`OblioInvoices/${transactionId}`, {
        transactionId,
        requestId,
        status: "processing",
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn(`[OBLIO_API] [${requestId}] Failed to mark processing:`, e?.message || e);
    }

    // 5) Build Oblio invoice payload
    const oblioCif = process.env.OBLIO_CIF || process.env.OBLIO_COMPANY_CIF || "";
    const oblioSeries = process.env.OBLIO_SERIES || "";
    if (!oblioCif || !oblioSeries) {
      return res.status(500).json({
        error: "Oblio not configured",
        requestId,
        details: { hasCif: !!oblioCif, hasSeries: !!oblioSeries }
      });
    }

    const issueDate = invoice?.issueDate || todayISO();
    const language = invoice?.language || "RO";
    const currency = invoice?.currency || "RON";
    const precision = typeof invoice?.precision === "number" ? invoice.precision : 2;
    const sendEmail = invoice?.sendEmail === false ? 0 : 1;

    const vatCfg = getSellerVatConfig();

    // Map productCode/meta.feature -> invoice line
    const productMap = {
      astrogama_natala: {
        name: "Analiză Astrogramă Natală",
        description: "Serviciu digital - analiză astrogramă natală"
      },
      astrogama_natala_other_person: {
        name: "Analiză Astrogramă Natală (altă persoană)",
        description: "Serviciu digital - analiză astrogramă natală pentru altă persoană"
      },
      sinastrie_relatie: {
        name: "Analiză Sinastrie Relație",
        description: "Serviciu digital - analiză sinastrie relație"
      },
      sinastrie_relatie_others: {
        name: "Analiză Sinastrie Relație (others)",
        description: "Serviciu digital - analiză sinastrie relație (others)"
      }
    };
    const mapped = productMap[productCode] || {
      name: meta?.feature || "Serviciu digital",
      description: `Serviciu digital (${productCode})`
    };

    // To avoid rounding mismatches, use vatIncluded=1 and price=gross (Oblio expects 0/1 reliably)
    const products = [
      {
        name: mapped.name,
        description: mapped.description,
        price: amountRON,
        measuringUnit: "bucată",
        vatName: vatCfg.vatName,
        vatPercentage: vatCfg.vatPercentage,
        vatIncluded: vatCfg.vatIncluded,
        quantity: 1,
        productType: "Serviciu"
      }
    ];

    const oblioPayload = {
      cif: oblioCif,
      client:
        billingType === "corporate"
          ? {
              cif: company?.vat || company?.cif || company?.companyVAT || "",
              name: company?.name || company?.company || "",
              rc: company?.reg || company?.rc || company?.companyReg || "",
              address: company?.address || company?.companyAddress || "",
              email,
              phone,
              contact: `${firstName} ${lastName}`.trim(),
              vatPayer: true,
              save: 1
            }
          : {
              name: `${firstName} ${lastName}`.trim(),
              address: line1,
              city,
              state,
              country,
              email,
              phone,
              vatPayer: false,
              save: 1
            },
      issueDate,
      seriesName: oblioSeries,
      language,
      precision,
      currency,
      sendEmail,
      products,
      mentions: `Factura generată automat (mobile). Stripe PI: ${transactionId}.`,
      internalNote: `transactionId:${transactionId} requestId:${requestId} productCode:${productCode} feature:${meta?.feature || ""}`,
      collect: {
        type: "Card",
        documentNumber: `STRIPE-${transactionId}`,
        value: amountRON,
        issueDate,
        mentions: "Plată procesată prin Stripe"
      }
    };

    // 6) Create invoice in Oblio
    const oblioResp = await createOlbioInvoiceFromPayload({
      invoicePayload: oblioPayload,
      requestId
    });

    if (!oblioResp || oblioResp.status !== 200 || !oblioResp.data) {
      // Persist failure for troubleshooting
      await handleUpdateFirestore(`OblioInvoices/${transactionId}`, {
        transactionId,
        requestId,
        status: "failed",
        updatedAt: new Date().toISOString(),
        stripe: {
          amount: amountRON,
          currency: piCurrency,
          customerEmail: email,
          status: piStatus
        },
        oblio: {
          raw: oblioResp || null
        }
      });

      return res.status(502).json({
        error: "Oblio invoice failed",
        requestId,
        transactionId
      });
    }

    const result = {
      seriesName: oblioResp.data.seriesName,
      number: oblioResp.data.number,
      link: oblioResp.data.link,
      total: amountRON,
      currency: "RON"
    };

    // 7) Persist idempotency record
    await handleUpdateFirestore(`OblioInvoices/${transactionId}`, {
      transactionId,
      requestId,
      status: "created",
      updatedAt: new Date().toISOString(),
      stripe: {
        amount: amountRON,
        currency: piCurrency,
        customerEmail: email,
        status: piStatus
      },
      oblio: result
    });

    return res.status(200).json({
      requestId,
      transactionId,
      oblio: result
    });
  } catch (err) {
    console.error(`[OBLIO_API] [${requestId}] Unexpected error:`, err?.message || err);
    return res.status(500).json({ error: "Internal server error", requestId });
  }
}


