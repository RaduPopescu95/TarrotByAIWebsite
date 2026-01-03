// pages/api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function isMaintenanceEnabled() {
  return String(process.env.PAYMENTS_MAINTENANCE_ENABLED || "").toLowerCase() === "true";
}

function getMaintenanceKeyFromReq(req) {
  const q = req.query?.maintenance_key;
  if (Array.isArray(q)) return q[0] || "";
  return q || "";
}

export default async (req, res) => {
  if (req.method === "POST") {
    // Maintenance gate (server-side hard block)
    if (isMaintenanceEnabled()) {
      const expected = process.env.PAYMENTS_MAINTENANCE_KEY || "";
      const provided = getMaintenanceKeyFromReq(req);
      if (!expected || provided !== expected) {
        return res.status(503).json({
          error: "maintenance",
          message:
            "Această secțiune este în proces de mentenanță. Vă rugăm să încercați mai târziu.",
        });
      }
    }

    const {
      costConsultatie,
      nume,
      email,
      alteInformatii,
      telefon,
      categorie,
      tipConsultatie,
      selectedSlot,
      owner_uid,
      adresaClient,
      // Optional buyer/company metadata for invoicing/e-Factura
      buyerType, // "company" | "person"
      buyerCif,
      buyerCnp,
      buyerCompanyName,
      buyerRegCom,
      buyerVatPayer, // boolean
      buyerStreet,
      buyerCity,
      buyerCounty,
      buyerPostalCode,
      buyerCountry,
      buyerContactName,
      buyerEmail: buyerEmailMeta,
      buyerPhone: buyerPhoneMeta,
      buyerIBAN,
      buyerBankName,
      // Line/item and invoice options
      serviceCode,
      vatRate,
      measureUnit,
      measureCode,
      paymentMethod,
      sendInvoiceEmail,
      eInvoice,
      dueDays,
    } = req.body;

    try {
      console.log("Stripe session data:", { costConsultatie, nume, email });
      console.log(
        "Stripe Public Key:",
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      );
      console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

      // Creează sesiunea de checkout cu opțiunea de creare factură
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "ro", // Setează limba pentru interfața de checkout
        line_items: [
          {
            price_data: {
              currency: "ron",
              product_data: {
                name: `Consultatie pentru ${nume}`,
              },
              unit_amount: costConsultatie, // Prețul în bani (de exemplu: 10000 bani pentru 100 RON)
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        billing_address_collection: "required", // Solicită adresa de facturare
        phone_number_collection: { enabled: true }, // Solicită numărul de telefon
        metadata: {
          nume,
          alteInformatii,
          telefon,
          categorie: JSON.stringify(categorie), // Transmite categoria ca string
          tipConsultatie,
          selectedSlot: JSON.stringify(selectedSlot),
          owner_uid,
          adresaClient,
          // Buyer/company metadata (only simple strings/booleans allowed in Stripe metadata)
          ...(buyerType ? { buyerType } : {}),
          ...(buyerCif ? { buyerCif } : {}),
          ...(buyerCnp ? { buyerCnp } : {}),
          ...(buyerCompanyName ? { buyerCompanyName } : {}),
          ...(buyerRegCom ? { buyerRegCom } : {}),
          ...(typeof buyerVatPayer !== "undefined" ? { buyerVatPayer: String(!!buyerVatPayer) } : {}),
          ...(buyerStreet ? { buyerStreet } : {}),
          ...(buyerCity ? { buyerCity } : {}),
          ...(buyerCounty ? { buyerCounty } : {}),
          ...(buyerPostalCode ? { buyerPostalCode } : {}),
          ...(buyerCountry ? { buyerCountry } : {}),
          ...(buyerContactName ? { buyerContactName } : {}),
          ...(buyerEmailMeta ? { buyerEmail: buyerEmailMeta } : {}),
          ...(buyerPhoneMeta ? { buyerPhone: buyerPhoneMeta } : {}),
          ...(buyerIBAN ? { buyerIBAN } : {}),
          ...(buyerBankName ? { buyerBankName } : {}),
          // Line and invoice options
          ...(serviceCode ? { serviceCode } : {}),
          ...(typeof vatRate !== "undefined" ? { vatRate: String(vatRate) } : {}),
          ...(measureUnit ? { measureUnit } : {}),
          ...(measureCode ? { measureCode } : {}),
          ...(paymentMethod ? { paymentMethod } : {}),
          ...(typeof sendInvoiceEmail !== "undefined" ? { sendInvoiceEmail: String(!!sendInvoiceEmail) } : {}),
          ...(typeof eInvoice !== "undefined" ? { eInvoice: String(!!eInvoice) } : {}),
          ...(typeof dueDays !== "undefined" ? { dueDays: String(dueDays) } : {}),
        },
        // Adaugă opțiunea pentru crearea unei facturi
        invoice_creation: {
          enabled: true,
        },
        success_url: `${req.headers.origin}/rezervare-finalizata?session_id={CHECKOUT_SESSION_ID}`, // Transmite session_id ca parametru de query
        cancel_url: `${req.headers.origin}/calendar`,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
