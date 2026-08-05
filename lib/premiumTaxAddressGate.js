function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function assessStripeCustomerTaxAddress(customer) {
  const address = customer?.address || customer?.shipping?.address || {};
  const country = clean(address.country).toUpperCase();
  const postalCode = clean(address.postal_code).replace(/\s+/g, "");
  const reasons = [];

  if (!clean(address.line1)) reasons.push("missing_line1");
  if (!clean(address.city)) reasons.push("missing_city");
  if (!country) reasons.push("missing_country");
  if (!postalCode) reasons.push("missing_postal_code");
  if (country === "RO" && !clean(address.state)) reasons.push("missing_romanian_county");
  if (country === "RO" && postalCode && !/^\d{6}$/.test(postalCode)) {
    reasons.push("invalid_romanian_postal_code");
  }

  return { complete: reasons.length === 0, reasons };
}

