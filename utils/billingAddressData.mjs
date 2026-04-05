import countriesList from "countries-list";

const { countries } = countriesList;

export const ROMANIA_COUNTRY_NAME = "Romania";
export const BUCHAREST_COUNTY_NAME = "Bucuresti";
export const BUCHAREST_SECTOR_OPTIONS = Object.freeze([
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Sector 4",
  "Sector 5",
  "Sector 6",
]);

const collator = new Intl.Collator("ro", { sensitivity: "base" });
const countryOptions = Object.entries(countries)
  .map(([code, details]) => ({
    code,
    name: typeof details?.name === "string" ? details.name.trim() : code,
  }))
  .filter((option) => option.name)
  .sort((left, right) => {
    if (left.name === ROMANIA_COUNTRY_NAME) return -1;
    if (right.name === ROMANIA_COUNTRY_NAME) return 1;
    return collator.compare(left.name, right.name);
  });

let billingAddressDatasetPromise = null;

function sanitizeString(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function removeDiacritics(value) {
  return sanitizeString(value, 255).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function simplifyValue(value) {
  return removeDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeOptionFromList(value, options = []) {
  const normalizedValue = simplifyValue(value);
  if (!normalizedValue) return "";
  const match = options.find((option) => simplifyValue(option) === normalizedValue);
  return match || sanitizeString(value, 120);
}

export function getCountryOptions() {
  return countryOptions;
}

export function normalizeCountrySelection(value) {
  const sanitized = sanitizeString(value, 120);
  const simplified = simplifyValue(sanitized);
  if (!simplified) return "";
  if (simplified === "ro" || simplified === "romania") return ROMANIA_COUNTRY_NAME;

  const match = countryOptions.find(
    (option) =>
      simplifyValue(option.name) === simplified || simplifyValue(option.code) === simplified
  );

  return match?.name || sanitized;
}

export function isRomaniaCountry(value) {
  return normalizeCountrySelection(value) === ROMANIA_COUNTRY_NAME;
}

export function normalizeRomanianCounty(value, counties = []) {
  const sanitized = sanitizeString(value, 120);
  const simplified = simplifyValue(sanitized);
  if (!simplified) return "";
  if (
    simplified === "bucuresti" ||
    simplified === "bucharest" ||
    simplified === "municipiul bucuresti"
  ) {
    return BUCHAREST_COUNTY_NAME;
  }
  return normalizeOptionFromList(sanitized, counties);
}

export function normalizeRomanianLocality(value, localities = []) {
  const sanitized = sanitizeString(value, 120);
  const simplified = simplifyValue(sanitized);
  if (!simplified) return "";

  const sectorMatch = simplified.match(/^sector\s*([1-6])$/);
  if (sectorMatch) {
    return `Sector ${sectorMatch[1]}`;
  }
  if (simplified === "bucuresti" || simplified === "bucharest") {
    return BUCHAREST_COUNTY_NAME;
  }

  return normalizeOptionFromList(sanitized, localities);
}

export function getLocalitiesForCounty(localitiesByCounty = {}, county = "") {
  const countyOptions = Object.keys(localitiesByCounty || {});
  const normalizedCounty = normalizeRomanianCounty(county, countyOptions);
  return Array.isArray(localitiesByCounty?.[normalizedCounty])
    ? localitiesByCounty[normalizedCounty]
    : [];
}

export function getAddressSelectionAfterCountryChange(nextCountry) {
  return {
    billingCountry: normalizeCountrySelection(nextCountry),
    billingCounty: "",
    billingCity: "",
  };
}

export function getAddressSelectionAfterCountyChange({
  nextCounty,
  currentCity,
  localitiesByCounty = {},
}) {
  const countyOptions = Object.keys(localitiesByCounty || {});
  const normalizedCounty = normalizeRomanianCounty(nextCounty, countyOptions);
  const localityOptions = getLocalitiesForCounty(localitiesByCounty, normalizedCounty);
  const normalizedCity = normalizeRomanianLocality(currentCity, localityOptions);
  const isCurrentCityValid = localityOptions.some(
    (option) => simplifyValue(option) === simplifyValue(normalizedCity)
  );

  return {
    billingCounty: normalizedCounty,
    billingCity: isCurrentCityValid ? normalizedCity : "",
  };
}

function sortRomanianValues(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => collator.compare(left, right));
}

function normalizeRomanianCityDatasetValue(value) {
  const normalized = normalizeRomanianLocality(value);
  if (!normalized || normalized === BUCHAREST_COUNTY_NAME) return "";
  return normalized;
}

export async function loadBillingAddressDataset() {
  if (!billingAddressDatasetPromise) {
    billingAddressDatasetPromise = (async () => {
      const module = await import("countrycitystatejson");
      const addressApi = module?.default || module;
      const counties = Array.isArray(addressApi?.getStatesByShort?.("RO"))
        ? addressApi.getStatesByShort("RO")
        : [];
      const normalizedCounties = sortRomanianValues(
        counties.map((county) => normalizeRomanianCounty(county))
      );
      const localitiesByCounty = {};

      normalizedCounties.forEach((county) => {
        if (county === BUCHAREST_COUNTY_NAME) {
          localitiesByCounty[county] = [...BUCHAREST_SECTOR_OPTIONS];
          return;
        }

        const localities = Array.isArray(addressApi?.getCities?.("RO", county))
          ? addressApi.getCities("RO", county)
          : [];
        localitiesByCounty[county] = sortRomanianValues(
          localities.map((locality) => normalizeRomanianCityDatasetValue(locality))
        );
      });

      if (!localitiesByCounty[BUCHAREST_COUNTY_NAME]) {
        localitiesByCounty[BUCHAREST_COUNTY_NAME] = [...BUCHAREST_SECTOR_OPTIONS];
      }

      return {
        countries: getCountryOptions(),
        romania: {
          counties: normalizedCounties,
          localitiesByCounty,
        },
      };
    })();
  }

  return billingAddressDatasetPromise;
}

export function createInitialBillingFormValues(overrides = {}) {
  return {
    billingType: "individual",
    billingCountry: ROMANIA_COUNTRY_NAME,
    billingCounty: "",
    billingCity: "",
    billingAddress: "",
    personalCnp: "",
    companyName: "",
    companyVAT: "",
    companyReg: "",
    companyAddress: "",
    ...overrides,
  };
}

export function buildBillingAuditInput({
  billingValues,
  firstName = "",
  lastName = "",
  fullName = "",
  email = "",
  phone = "",
  individualAddress = "",
}) {
  const source = billingValues && typeof billingValues === "object" ? billingValues : {};
  const billingType = source.billingType === "corporate" ? "corporate" : "individual";
  const resolvedAddress =
    billingType === "corporate" ? source.companyAddress : individualAddress || source.billingAddress;

  return {
    billingType,
    firstName: sanitizeString(firstName, 120),
    lastName: sanitizeString(lastName, 120),
    name: sanitizeString(fullName, 240),
    cnp: billingType === "corporate" ? "" : sanitizeString(source.personalCnp, 32),
    companyName: sanitizeString(source.companyName, 255),
    cif: sanitizeString(source.companyVAT, 64),
    reg: sanitizeString(source.companyReg, 64),
    address: sanitizeString(resolvedAddress, 255),
    state: sanitizeString(source.billingCounty, 120),
    city: sanitizeString(source.billingCity, 120),
    country: normalizeCountrySelection(source.billingCountry),
    email: sanitizeString(email, 320),
    phone: sanitizeString(phone, 64),
    contact: sanitizeString(fullName, 240),
  };
}

export function buildCourseBillingDetails({
  billingValues,
  firstName = "",
  lastName = "",
  email = "",
  phone = "",
  individualAddress = "",
}) {
  const source = billingValues && typeof billingValues === "object" ? billingValues : {};
  const billingType = source.billingType === "corporate" ? "corporate" : "individual";
  const normalizedCountry = normalizeCountrySelection(source.billingCountry);
  const resolvedAddress =
    billingType === "corporate" ? source.companyAddress : individualAddress || source.billingAddress;

  return {
    billingType,
    firstName: sanitizeString(firstName, 120),
    lastName: sanitizeString(lastName, 120),
    cnp: billingType === "corporate" ? "" : sanitizeString(source.personalCnp, 32),
    email: sanitizeString(email, 320),
    phone: sanitizeString(phone, 64),
    address: {
      line1: sanitizeString(resolvedAddress, 255),
      city: sanitizeString(source.billingCity, 120),
      state: sanitizeString(source.billingCounty, 120),
      country: normalizedCountry,
      postalCode: "",
    },
    company: {
      name: sanitizeString(source.companyName, 255),
      vat: sanitizeString(source.companyVAT, 64),
      reg: sanitizeString(source.companyReg, 64),
      address: sanitizeString(source.companyAddress, 255),
    },
    invoicePreferences: {
      sendEmail: true,
      eInvoice: isRomaniaCountry(normalizedCountry),
    },
  };
}

export function mapBillingAuditErrorsToForm(
  errorsByField = {},
  { billingType = "individual", individualAddressField = "billingAddress" } = {}
) {
  const mappedErrors = {};

  if (errorsByField.name) {
    if (billingType === "corporate") {
      mappedErrors.companyName = errorsByField.name;
    }
  }
  if (errorsByField.address) {
    mappedErrors[
      billingType === "corporate" ? "companyAddress" : individualAddressField
    ] = errorsByField.address;
  }
  if (errorsByField.cnp) {
    mappedErrors.personalCnp = errorsByField.cnp;
  }
  if (errorsByField.cif) {
    mappedErrors.companyVAT = errorsByField.cif;
  }
  if (errorsByField.state) {
    mappedErrors.billingCounty = errorsByField.state;
  }
  if (errorsByField.city) {
    mappedErrors.billingCity = errorsByField.city;
  }
  if (errorsByField.country) {
    mappedErrors.billingCountry = errorsByField.country;
  }

  return mappedErrors;
}
