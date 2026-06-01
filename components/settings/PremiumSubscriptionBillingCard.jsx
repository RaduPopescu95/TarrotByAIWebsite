import * as React from "react";
import { useTranslation } from "next-i18next";
import { useAuth } from "../../context/AuthContext";
import BillingDetailsForm from "../BillingDetailsForm";
import { handleUpdateFirestore } from "../../utils/firestoreUtils";
import {
  buildBillingAuditInput,
  buildCourseBillingDetails,
  billingValuesIndividualFrom,
  createInitialBillingFormValues,
  hydrateBillingUiFromPremiumProfile,
  INDIVIDUAL_BILLING_AUDIT_OPTS,
  mapBillingAuditErrorsToForm,
} from "../../utils/billingAddressData.mjs";
import { normalizeBillingContext } from "../../utils/billingAudit.mjs";

function getCheckoutInputClass(error) {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    error
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
  ].join(" ");
}

export default function PremiumSubscriptionBillingCard({
  /** @type {(payload: { message: string }) => void} */
  onNotify,
}) {
  const { t } = useTranslation("common");
  const { currentUser, userData, setUserData } = useAuth();

  const [premiumBillContact, setPremiumBillContact] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [premiumBillForm, setPremiumBillForm] = React.useState(createInitialBillingFormValues());
  const [premiumBillErrors, setPremiumBillErrors] = React.useState({});
  const [premiumBillSaving, setPremiumBillSaving] = React.useState(false);
  const premiumProfileHydratedRef = React.useRef(false);

  React.useEffect(() => {
    premiumProfileHydratedRef.current = false;
  }, [userData?.owner_uid]);

  React.useEffect(() => {
    if (!userData?.owner_uid) return;
    const fromProfile = hydrateBillingUiFromPremiumProfile(userData?.premiumBillingProfile);
    if (fromProfile && !premiumProfileHydratedRef.current) {
      setPremiumBillContact(fromProfile.billingContact);
      setPremiumBillForm(fromProfile.billingForm);
      premiumProfileHydratedRef.current = true;
      return;
    }
    if (premiumProfileHydratedRef.current) return;
    setPremiumBillContact((prev) => ({
      firstName: prev.firstName || userData?.first_name || "",
      lastName: prev.lastName || userData?.last_name || "",
      email: prev.email || userData?.email || currentUser?.email || "",
      phone:
        prev.phone ||
        userData?.telefon ||
        userData?.phoneNumber ||
        currentUser?.phoneNumber ||
        "",
    }));
    premiumProfileHydratedRef.current = true;
  }, [
    currentUser?.email,
    currentUser?.phoneNumber,
    userData?.owner_uid,
    userData?.premiumBillingProfile,
    userData?.first_name,
    userData?.last_name,
    userData?.email,
    userData?.telefon,
    userData?.phoneNumber,
  ]);

  const handlePremiumBillContactChange = (field, value) => {
    setPremiumBillContact((prev) => ({ ...prev, [field]: value }));
    setPremiumBillErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handlePremiumBillFieldChange = (field, value) => {
    setPremiumBillForm((prev) => ({ ...prev, [field]: value }));
    setPremiumBillErrors((prev) => ({ ...prev, [field]: false }));
  };

  const savePremiumBillingProfile = async () => {
    if (!userData?.owner_uid) return;
    setPremiumBillSaving(true);
    setPremiumBillErrors({});
    try {
      const nextErrors = {};
      if (!premiumBillContact.firstName.trim()) {
        nextErrors.firstName = t("coursesBillingFirstNameRequired", {
          defaultValue: "Prenumele este obligatoriu pentru facturare.",
        });
      }
      if (!premiumBillContact.lastName.trim()) {
        nextErrors.lastName = t("coursesBillingLastNameRequired", {
          defaultValue: "Numele este obligatoriu pentru facturare.",
        });
      }
      if (!premiumBillContact.email.trim()) {
        nextErrors.email = t("coursesBillingEmailRequired", {
          defaultValue: "Email-ul este obligatoriu pentru facturare.",
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(premiumBillContact.email.trim())) {
        nextErrors.email = t("coursesBillingEmailInvalid", {
          defaultValue: "Email-ul introdus nu este valid.",
        });
      }
      if (!premiumBillContact.phone.trim()) {
        nextErrors.phone = t("coursesBillingPhoneRequired", {
          defaultValue: "Telefonul este obligatoriu pentru facturare.",
        });
      }

      const billingValuesIndividual = billingValuesIndividualFrom(premiumBillForm);

      const rawBillingInput = buildBillingAuditInput({
        billingValues: billingValuesIndividual,
        firstName: premiumBillContact.firstName,
        lastName: premiumBillContact.lastName,
        fullName: `${premiumBillContact.firstName} ${premiumBillContact.lastName}`.trim(),
        email: premiumBillContact.email,
        phone: premiumBillContact.phone,
        individualAddress: billingValuesIndividual.billingAddress,
      });
      const billingAudit = normalizeBillingContext(rawBillingInput, INDIVIDUAL_BILLING_AUDIT_OPTS);
      if (!billingAudit.validation.ok) {
        Object.assign(
          nextErrors,
          mapBillingAuditErrorsToForm(billingAudit.validation.errorsByField, {
            billingType: "individual",
          }),
        );
      }
      const errKeys = Object.keys(nextErrors);
      if (errKeys.length > 0) {
        setPremiumBillErrors(nextErrors);
        const firstErr = Object.values(nextErrors)[0];
        onNotify?.({
          message: firstErr || t("coursesBillingFormInvalid", { defaultValue: "Completează datele de facturare." }),
        });
        return;
      }

      const billingDetails = buildCourseBillingDetails({
        billingValues: billingValuesIndividual,
        firstName: premiumBillContact.firstName,
        lastName: premiumBillContact.lastName,
        email: premiumBillContact.email,
        phone: premiumBillContact.phone,
        individualAddress: billingValuesIndividual.billingAddress,
      });

      const prior =
        userData?.premiumBillingProfile && typeof userData.premiumBillingProfile === "object"
          ? userData.premiumBillingProfile
          : {};
      const copyUserData = {
        ...userData,
        premiumBillingProfile: {
          ...prior,
          billing: billingDetails,
          rawFormValues: rawBillingInput,
          normalizedBeforeCheckout: billingAudit.normalizedClient,
          stripeMetadataSnapshot: prior.stripeMetadataSnapshot || {},
          updatedFromSettingsAt: new Date().toISOString(),
        },
      };

      await handleUpdateFirestore(`Users/${userData.owner_uid}`, copyUserData);
      setUserData(copyUserData);
      onNotify?.({ message: t("settingsPremiumBillingSaved") });
    } catch (e) {
      console.error("[PremiumSubscriptionBillingCard] premium_billing", e);
      onNotify?.({ message: e?.message || t("settingsPremiumBillingSaveError") });
    } finally {
      setPremiumBillSaving(false);
    }
  };

  return (
    <div
      className="mb-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      style={{ maxWidth: 720, width: "100%" }}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("settingsPremiumBillingTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("settingsPremiumBillingHint")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            {t("coursesBillingFirstNameLabel", { defaultValue: "Prenume" })}
          </label>
          <input
            type="text"
            value={premiumBillContact.firstName}
            onChange={(e) => handlePremiumBillContactChange("firstName", e.target.value)}
            className={getCheckoutInputClass(premiumBillErrors.firstName)}
            disabled={premiumBillSaving}
          />
          {typeof premiumBillErrors.firstName === "string" ? (
            <p className="text-xs font-medium text-red-600">{premiumBillErrors.firstName}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            {t("coursesBillingLastNameLabel", { defaultValue: "Nume" })}
          </label>
          <input
            type="text"
            value={premiumBillContact.lastName}
            onChange={(e) => handlePremiumBillContactChange("lastName", e.target.value)}
            className={getCheckoutInputClass(premiumBillErrors.lastName)}
            disabled={premiumBillSaving}
          />
          {typeof premiumBillErrors.lastName === "string" ? (
            <p className="text-xs font-medium text-red-600">{premiumBillErrors.lastName}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            {t("coursesBillingEmailLabel", { defaultValue: "Email facturare" })}
          </label>
          <input
            type="email"
            value={premiumBillContact.email}
            onChange={(e) => handlePremiumBillContactChange("email", e.target.value)}
            className={getCheckoutInputClass(premiumBillErrors.email)}
            disabled={premiumBillSaving}
          />
          {typeof premiumBillErrors.email === "string" ? (
            <p className="text-xs font-medium text-red-600">{premiumBillErrors.email}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            {t("coursesBillingPhoneLabel", { defaultValue: "Telefon" })}
          </label>
          <input
            type="tel"
            value={premiumBillContact.phone}
            onChange={(e) => handlePremiumBillContactChange("phone", e.target.value)}
            className={getCheckoutInputClass(premiumBillErrors.phone)}
            disabled={premiumBillSaving}
          />
          {typeof premiumBillErrors.phone === "string" ? (
            <p className="text-xs font-medium text-red-600">{premiumBillErrors.phone}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <BillingDetailsForm
          variant="tailwind"
          individualBillingOnly
          hidePersonalCnp
          title={t("coursesBillingCardTitle", { defaultValue: "Date pentru factura" })}
          description={t("coursesBillingCardDescription", {
            defaultValue:
              "Pentru clientii din Romania, judetul si localitatea se aleg din listele valide pentru Oblio.",
          })}
          billingValues={premiumBillForm}
          onBillingChange={handlePremiumBillFieldChange}
          errors={premiumBillErrors}
          individualAddressValue={premiumBillForm.billingAddress}
          onIndividualAddressChange={(value) => handlePremiumBillFieldChange("billingAddress", value)}
          disabled={premiumBillSaving}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => savePremiumBillingProfile()}
          disabled={premiumBillSaving}
          className={`inline-flex min-w-[200px] items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition ${
            premiumBillSaving
              ? "cursor-not-allowed bg-slate-400"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
          }`}
        >
          {premiumBillSaving ? t("settingsPremiumBillingSaving") : t("settingsPremiumBillingSave")}
        </button>
      </div>
    </div>
  );
}
