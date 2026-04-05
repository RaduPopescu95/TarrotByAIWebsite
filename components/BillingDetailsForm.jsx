import React, { useEffect, useMemo, useState } from "react";
import {
  BUCHAREST_COUNTY_NAME,
  getAddressSelectionAfterCountryChange,
  getAddressSelectionAfterCountyChange,
  getLocalitiesForCounty,
  isRomaniaCountry,
  normalizeCountrySelection,
  normalizeRomanianCounty,
  normalizeRomanianLocality,
} from "../utils/billingAddressData.mjs";

let billingAddressOptionsPromise = null;

function loadBillingAddressOptions() {
  if (!billingAddressOptionsPromise) {
    billingAddressOptionsPromise = fetch("/api/billing/address-options", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load billing address options");
      }
      return data;
    });
  }

  return billingAddressOptionsPromise;
}

function hasFieldError(value) {
  return Boolean(value);
}

function getFieldErrorMessage(value) {
  return typeof value === "string" ? value : "";
}

function getBootstrapControlClass(error) {
  return `form-control${hasFieldError(error) ? " is-invalid" : ""}`;
}

function getTailwindControlClass(error) {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    hasFieldError(error)
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
  ].join(" ");
}

function renderFieldError(error, variant) {
  const message = getFieldErrorMessage(error);
  if (!message) return null;

  return variant === "tailwind" ? (
    <p className="text-xs font-medium text-red-600">{message}</p>
  ) : (
    <div className="invalid-feedback d-block">{message}</div>
  );
}

function renderFieldHint(hint, variant) {
  if (!hint) return null;
  return variant === "tailwind" ? (
    <p className="text-xs text-slate-500">{hint}</p>
  ) : (
    <small className="form-text text-muted">{hint}</small>
  );
}

function BootstrapField({
  widthClass,
  label,
  error,
  hint,
  children,
}) {
  return (
    <div className={widthClass}>
      <div className="form-group mb-3">
        <label className="form-label">{label}</label>
        {children}
        {renderFieldHint(hint, "bootstrap")}
        {renderFieldError(error, "bootstrap")}
      </div>
    </div>
  );
}

function TailwindField({
  widthClass,
  label,
  error,
  hint,
  children,
}) {
  return (
    <div className={widthClass}>
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {children}
        {renderFieldHint(hint, "tailwind")}
        {renderFieldError(error, "tailwind")}
      </div>
    </div>
  );
}

export default function BillingDetailsForm({
  variant = "bootstrap",
  title = "",
  description = "",
  billingValues,
  onBillingChange,
  errors = {},
  individualAddressValue = "",
  onIndividualAddressChange,
  individualAddressLabel = "Adresa",
  individualAddressPlaceholder = "Strada, numar, bloc, apartament",
  hideIndividualAddressField = false,
  disabled = false,
}) {
  const [addressOptions, setAddressOptions] = useState(null);
  const [addressOptionsError, setAddressOptionsError] = useState("");

  useEffect(() => {
    let active = true;

    loadBillingAddressOptions()
      .then((data) => {
        if (!active) return;
        setAddressOptions(data);
        setAddressOptionsError("");
      })
      .catch((error) => {
        if (!active) return;
        setAddressOptionsError(error?.message || "Nu am putut incarca listele de adrese.");
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedCountry = normalizeCountrySelection(billingValues?.billingCountry || "");
  const usesRomanianSelectors = isRomaniaCountry(normalizedCountry || billingValues?.billingCountry);
  const countryOptions = Array.isArray(addressOptions?.countries) ? addressOptions.countries : [];
  const countyOptions = Array.isArray(addressOptions?.romania?.counties)
    ? addressOptions.romania.counties
    : [];
  const localitiesByCounty = addressOptions?.romania?.localitiesByCounty || {};
  const localityOptions = useMemo(
    () => getLocalitiesForCounty(localitiesByCounty, billingValues?.billingCounty),
    [billingValues?.billingCounty, localitiesByCounty]
  );

  useEffect(() => {
    if (!billingValues?.billingCountry || !onBillingChange) return;
    const nextCountry = normalizeCountrySelection(billingValues.billingCountry);
    if (nextCountry && nextCountry !== billingValues.billingCountry) {
      onBillingChange("billingCountry", nextCountry);
    }
  }, [billingValues?.billingCountry, onBillingChange]);

  useEffect(() => {
    if (!usesRomanianSelectors || !countyOptions.length || !onBillingChange) return;

    const normalizedCounty = normalizeRomanianCounty(billingValues?.billingCounty, countyOptions);
    if (billingValues?.billingCounty && normalizedCounty !== billingValues.billingCounty) {
      onBillingChange("billingCounty", normalizedCounty);
      return;
    }

    const nextSelection = getAddressSelectionAfterCountyChange({
      nextCounty: normalizedCounty,
      currentCity: billingValues?.billingCity,
      localitiesByCounty,
    });

    if (
      billingValues?.billingCity &&
      nextSelection.billingCity !== billingValues.billingCity
    ) {
      onBillingChange("billingCity", nextSelection.billingCity);
    }
  }, [
    billingValues?.billingCity,
    billingValues?.billingCounty,
    countyOptions,
    localitiesByCounty,
    onBillingChange,
    usesRomanianSelectors,
  ]);

  const commitBillingField = (field, value) => {
    if (typeof onBillingChange === "function") {
      onBillingChange(field, value);
    }
  };

  const handleCountryChange = (nextValue) => {
    const nextSelection = getAddressSelectionAfterCountryChange(nextValue);
    commitBillingField("billingCountry", nextSelection.billingCountry);
    commitBillingField("billingCounty", nextSelection.billingCounty);
    commitBillingField("billingCity", nextSelection.billingCity);
  };

  const handleCountyChange = (nextValue) => {
    const nextSelection = getAddressSelectionAfterCountyChange({
      nextCounty: nextValue,
      currentCity: billingValues?.billingCity,
      localitiesByCounty,
    });
    commitBillingField("billingCounty", nextSelection.billingCounty);
    if (nextSelection.billingCity !== billingValues?.billingCity) {
      commitBillingField("billingCity", nextSelection.billingCity);
    }
  };

  const handleLocalityChange = (nextValue) => {
    const nextCity = normalizeRomanianLocality(nextValue, localityOptions);
    commitBillingField("billingCity", nextCity);
  };

  const Field = variant === "tailwind" ? TailwindField : BootstrapField;
  const rowClass = variant === "tailwind" ? "grid gap-4 md:grid-cols-2" : "row";
  const halfWidth = variant === "tailwind" ? "" : "col-md-6 col-sm-12";
  const thirdWidth = variant === "tailwind" ? "" : "col-md-4 col-sm-12";
  const fullWidth = variant === "tailwind" ? "md:col-span-2" : "col-md-12 col-sm-12";
  const formControlClass = variant === "tailwind" ? getTailwindControlClass : getBootstrapControlClass;
  const sectorsHint =
    usesRomanianSelectors && billingValues?.billingCounty === BUCHAREST_COUNTY_NAME
      ? "Pentru Bucuresti poti alege doar Sector 1-6."
      : "";

  return (
    <div className={variant === "tailwind" ? "space-y-4" : ""}>
      {(title || description) && (
        <div className={variant === "tailwind" ? "space-y-1" : "mb-3"}>
          {title ? (
            variant === "tailwind" ? (
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            ) : (
              <h6 className="mb-1">{title}</h6>
            )
          ) : null}
          {description ? (
            variant === "tailwind" ? (
              <p className="text-sm text-slate-600">{description}</p>
            ) : (
              <p className="mb-0 text-muted">{description}</p>
            )
          ) : null}
        </div>
      )}

      {addressOptionsError ? (
        variant === "tailwind" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {addressOptionsError}
          </div>
        ) : (
          <div className="alert alert-danger mb-3">{addressOptionsError}</div>
        )
      ) : null}

      <div className={rowClass}>
        <Field widthClass={fullWidth} label="Tip facturare" error={errors.billingType}>
          <select
            className={formControlClass(errors.billingType)}
            value={billingValues?.billingType || "individual"}
            onChange={(event) => commitBillingField("billingType", event.target.value)}
            disabled={disabled}
          >
            <option value="individual">Persoana fizica</option>
            <option value="corporate">Firma</option>
          </select>
        </Field>

        {billingValues?.billingType === "corporate" ? (
          <>
            <Field widthClass={halfWidth} label="Denumire firma" error={errors.companyName}>
              <input
                type="text"
                className={formControlClass(errors.companyName)}
                value={billingValues?.companyName || ""}
                onChange={(event) => commitBillingField("companyName", event.target.value)}
                disabled={disabled}
              />
            </Field>
            <Field widthClass={halfWidth} label="CUI / CIF" error={errors.companyVAT}>
              <input
                type="text"
                className={formControlClass(errors.companyVAT)}
                value={billingValues?.companyVAT || ""}
                onChange={(event) => commitBillingField("companyVAT", event.target.value)}
                disabled={disabled}
              />
            </Field>
            <Field widthClass={halfWidth} label="Nr. Reg. Com. (optional)" error={errors.companyReg}>
              <input
                type="text"
                className={formControlClass(errors.companyReg)}
                value={billingValues?.companyReg || ""}
                onChange={(event) => commitBillingField("companyReg", event.target.value)}
                disabled={disabled}
              />
            </Field>
            <Field widthClass={halfWidth} label="Adresa firma" error={errors.companyAddress}>
              <input
                type="text"
                className={formControlClass(errors.companyAddress)}
                value={billingValues?.companyAddress || ""}
                onChange={(event) => commitBillingField("companyAddress", event.target.value)}
                disabled={disabled}
              />
            </Field>
          </>
        ) : (
          <>
            <Field widthClass={halfWidth} label="CNP" error={errors.personalCnp}>
              <input
                type="text"
                className={formControlClass(errors.personalCnp)}
                value={billingValues?.personalCnp || ""}
                onChange={(event) => commitBillingField("personalCnp", event.target.value)}
                disabled={disabled}
              />
            </Field>

            {!hideIndividualAddressField && (
              <Field
                widthClass={halfWidth}
                label={individualAddressLabel}
                error={errors.billingAddress}
              >
                <input
                  type="text"
                  className={formControlClass(errors.billingAddress)}
                  value={individualAddressValue || ""}
                  onChange={(event) => onIndividualAddressChange?.(event.target.value)}
                  placeholder={individualAddressPlaceholder}
                  disabled={disabled}
                />
              </Field>
            )}
          </>
        )}

        <Field widthClass={thirdWidth} label="Tara" error={errors.billingCountry}>
          <select
            className={formControlClass(errors.billingCountry)}
            value={normalizedCountry || billingValues?.billingCountry || ""}
            onChange={(event) => handleCountryChange(event.target.value)}
            disabled={disabled || countryOptions.length === 0}
          >
            <option value="">Selecteaza tara</option>
            {countryOptions.map((option) => (
              <option key={option.code} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </Field>

        {usesRomanianSelectors ? (
          <>
            <Field widthClass={thirdWidth} label="Judet" error={errors.billingCounty}>
              <select
                className={formControlClass(errors.billingCounty)}
                value={normalizeRomanianCounty(billingValues?.billingCounty, countyOptions)}
                onChange={(event) => handleCountyChange(event.target.value)}
                disabled={disabled || countyOptions.length === 0}
              >
                <option value="">Selecteaza judetul</option>
                {countyOptions.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              widthClass={thirdWidth}
              label="Localitate"
              error={errors.billingCity}
              hint={sectorsHint}
            >
              <select
                className={formControlClass(errors.billingCity)}
                value={normalizeRomanianLocality(billingValues?.billingCity, localityOptions)}
                onChange={(event) => handleLocalityChange(event.target.value)}
                disabled={disabled || !billingValues?.billingCounty || localityOptions.length === 0}
              >
                <option value="">
                  {billingValues?.billingCounty
                    ? "Selecteaza localitatea"
                    : "Selecteaza mai intai judetul"}
                </option>
                {localityOptions.map((locality) => (
                  <option key={locality} value={locality}>
                    {locality}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <>
            <Field widthClass={thirdWidth} label="Judet / Regiune" error={errors.billingCounty}>
              <input
                type="text"
                className={formControlClass(errors.billingCounty)}
                value={billingValues?.billingCounty || ""}
                onChange={(event) => commitBillingField("billingCounty", event.target.value)}
                disabled={disabled}
              />
            </Field>
            <Field widthClass={thirdWidth} label="Oras / Localitate" error={errors.billingCity}>
              <input
                type="text"
                className={formControlClass(errors.billingCity)}
                value={billingValues?.billingCity || ""}
                onChange={(event) => commitBillingField("billingCity", event.target.value)}
                disabled={disabled}
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}
