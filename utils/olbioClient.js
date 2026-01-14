// utils/olbioClient.js
//
// Oblio invoicing client using OAuth token and /api/docs/invoice endpoint.
// Maps booking (consultații) and conference payments into e-Factura-ready payload.
// Fail-safe: logs errors and returns null so webhook is never blocked.
//

let OBLIO_TOKEN_CACHE = {
	accessToken: "",
	expiresAtMs: 0,
};

function isTruthyEnv(val) {
	if (typeof val !== "string") return false;
	return ["1", "true", "yes", "y", "on"].includes(val.trim().toLowerCase());
}

function getSellerVatConfig(sessionMetadata) {
	// IMPORTANT:
	// Oblio can "normalize" prices depending on seller VAT settings.
	// If the seller is NOT VAT payer, sending vatIncluded=1 with a non-zero VAT
	// can cause Oblio to back out VAT (e.g. 300 -> 252.10) and keep total net.
	//
	// To ensure invoice total always matches Stripe amount paid:
	// - If seller VAT payer: send vatIncluded=1 and vatPercentage>0 (gross in `price`)
	// - If seller NOT VAT payer: force vatPercentage=0 and vatIncluded=0 (gross in `price`)
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
	// Support both naming variants:
	// - OBLIO_CLIENT_ID / OBLIO_CLIENT_SECRET (from many integrations/examples)
	// - OBLIO_EMAIL / OBLIO_SECRET (legacy in this repo)
	const email = process.env.OBLIO_EMAIL || "";
	const secret = process.env.OBLIO_SECRET || "";
	if (!email || !secret) {
		throw new Error("Missing OBLIO_CLIENT_ID/OBLIO_CLIENT_SECRET (or OBLIO_EMAIL/OBLIO_SECRET)");
	}
	// Reuse cached token if still valid
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
	// subtract 60s for safety margin
	OBLIO_TOKEN_CACHE.expiresAtMs = Date.now() + Math.max(0, expiresInSec - 60) * 1000;
	return token;
}

export async function createOlbioInvoice({ type, rezervareData, session, conferinta, participant }) {
	try {
		const oblioCif = process.env.OBLIO_CIF || "";
		const oblioSeriesName = process.env.OBLIO_SERIES || "FCT";
		const apiBase =
			(process.env.OBLIO_API_BASE_URL || "https://www.oblio.eu").replace(/\/+$/, "");

		if (!oblioCif) {
			console.log("[OBLIO] Skipping invoice: missing OBLIO_CIF");
			return null;
		}

		// Metadata
		const m = session?.metadata || {};
		const vatCfg = getSellerVatConfig(m);

		// Gross amount (RON) – keep 2 decimals to avoid mismatch vs Stripe
		const grossAmountRaw =
			typeof session?.amount_total === "number"
				? session.amount_total / 100
				: rezervareData?.costConsultatie
				? Number(rezervareData.costConsultatie)
				: 0;
		const grossAmount = Math.round((Number(grossAmountRaw) || 0) * 100) / 100;

		// Customer data (corporate vs individual)
		const buyerType = m.buyerType || ""; // company | person
		const clientNameCorporate = m.buyerCompanyName || "";
		const clientVAT = m.buyerCif || "";
		const clientReg = m.buyerRegCom || "";
		const clientAddressCorporate = m.buyerStreet || "";

		const clientNameIndividual = rezervareData?.nume || session?.customer_details?.name || participant?.nume || "Client";
		const clientEmail =
			m.buyerEmail ||
			rezervareData?.email ||
			session?.customer_details?.email ||
			session?.customer_email ||
			participant?.email ||
			"";
		const clientPhone =
			m.buyerPhone ||
			rezervareData?.telefon ||
			session?.customer_details?.phone ||
			participant?.telefon ||
			"";
		const clientAddrInd = rezervareData?.adresaClient || "";
		const clientCity = m.buyerCity || "";
		const clientCounty = m.buyerCounty || "";
		const clientCountry = m.buyerCountry || "Romania";

		// Product line (displayed on invoice) – keep it short (no extra "Categorie/Tip/Zi/Ora" lines)
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

		const description = "";

		// Build client block per Oblio schema
		const clientBlock =
			buyerType === "company" && clientNameCorporate
				? {
						cif: clientVAT || "",
						name: clientNameCorporate,
						rc: clientReg || "",
						address: clientAddressCorporate || "",
						email: clientEmail,
						phone: clientPhone || "",
						contact: clientNameIndividual,
						vatPayer: true,
						save: 1,
				  }
				: {
						name: clientNameIndividual,
						address: clientAddrInd || "",
						state: clientCounty || "",
						city: clientCity || "",
						country: clientCountry || "Romania",
						email: clientEmail,
						phone: clientPhone || "",
						vatPayer: false,
						save: 1,
				  };

		const issueDate = new Date().toISOString().split("T")[0];
		const invoicePayload = {
			cif: oblioCif,
			client: clientBlock,
			issueDate,
			seriesName: oblioSeriesName,
			language: "RO",
			precision: 2,
			currency: "RON",
			sendEmail: 1,
			products: [
				{
					name: itemName,
					description,
					// Send gross with VAT included so invoice total matches Stripe exactly (e.g. 2.00 stays 2.00)
					price: grossAmount,
					measuringUnit: m.measureUnit || "bucată",
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
					? `Conferinta: ${conferinta?.titlu || ""} | Stripe Payment`
					: `MeetingCode: ${rezervareData?.meetingCode || ""} | Stripe Payment`,
			collect: {
				type: "Card",
				documentNumber: `STRIPE-${session?.id || rezervareData?.session_id || ""}`,
				value: grossAmount,
				issueDate,
				mentions: "Plată procesată prin Stripe",
			},
		};

		console.log("[OBLIO] Creating invoice payload:", JSON.stringify(invoicePayload, null, 2));

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
			console.error("[OBLIO] Invoice API error:", resp.status, txt);
			return null;
		}
		const result = await resp.json().catch(() => ({}));
		console.log("[OBLIO] Invoice created:", result);
		return result;
	} catch (err) {
		console.error("[OBLIO] Unexpected error creating invoice:", err?.message || err);
		return null;
	}
}

// For custom invoice creation (e.g. mobile app) where we already have a fully prepared
// Oblio invoice payload (matching /api/docs/invoice schema).
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
			} catch (e) {
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


