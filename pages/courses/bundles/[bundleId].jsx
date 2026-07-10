import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BillingDetailsForm from "../../../components/BillingDetailsForm";
import CourseCard from "../../../components/Courses/CourseCard";
import { useAuth } from "../../../context/AuthContext";
import { getFirebaseBearerHeader } from "../../../utils/firebaseAuthHeaders";
import {
  buildBillingAuditInput,
  buildCourseBillingDetails,
  billingValuesIndividualFrom,
  createInitialBillingFormValues,
  INDIVIDUAL_BILLING_AUDIT_OPTS,
  mapBillingAuditErrorsToForm,
} from "../../../utils/billingAddressData.mjs";
import {
  buildInvoiceDecision,
  normalizeBillingContext,
} from "../../../utils/billingAudit.mjs";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function formatPrice(value, currency, locale) {
  return new Intl.NumberFormat(locale || "ro-RO", {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

export default function CourseBundleDetailPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { currentUser } = useAuth();
  const rawBundleId = router.query?.bundleId;
  const bundleId = Array.isArray(rawBundleId) ? rawBundleId[0] : rawBundleId;
  const [bundle, setBundle] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [ownedCourseIds, setOwnedCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [billingForm, setBillingForm] = useState(createInitialBillingFormValues());
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const loadBundle = useCallback(async () => {
    if (!bundleId) return null;
    const headers = await getFirebaseBearerHeader({ required: false }).catch(() => ({}));
    const response = await fetch(
      `/api/course-bundles/${encodeURIComponent(bundleId)}?locale=${encodeURIComponent(
        router.locale || "ro"
      )}&channel=website`,
      { headers }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Nu am putut încărca trilogia.");
    setBundle(data.bundle || null);
    setHasAccess(Boolean(data.hasAccess));
    setOwnedCourseIds(Array.isArray(data.ownedCourseIds) ? data.ownedCourseIds : []);
    return data;
  }, [bundleId, router.locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadBundle()
      .catch((loadError) => {
        if (active) setError(loadError.message || "Nu am putut încărca trilogia.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadBundle, currentUser]);

  useEffect(() => {
    if (!router.query?.success || !currentUser || !bundleId) return;
    let active = true;
    const poll = async () => {
      for (let index = 0; index < 6; index += 1) {
        const data = await loadBundle().catch(() => null);
        if (!active || data?.hasAccess) return;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    };
    void poll();
    return () => {
      active = false;
    };
  }, [router.query?.success, currentUser, bundleId, loadBundle]);

  useEffect(() => {
    if (!currentUser) return;
    const displayName = currentUser.displayName || "";
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    setContact((current) => ({
      firstName: current.firstName || parts[0] || "",
      lastName: current.lastName || parts.slice(1).join(" "),
      email: current.email || currentUser.email || "",
      phone: current.phone || currentUser.phoneNumber || "",
    }));
  }, [currentUser]);

  const handleCheckout = async () => {
    if (!bundleId || !bundle) return;
    if (!currentUser) {
      router.push(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    const billingValues = billingValuesIndividualFrom(billingForm);
    const nextErrors = {};
    if (!contact.firstName.trim()) nextErrors.firstName = "Prenumele este obligatoriu.";
    if (!contact.lastName.trim()) nextErrors.lastName = "Numele este obligatoriu.";
    if (!contact.email.trim()) nextErrors.email = "Email-ul este obligatoriu.";
    if (!contact.phone.trim()) nextErrors.phone = "Telefonul este obligatoriu.";

    const rawBillingInput = buildBillingAuditInput({
      billingValues,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: `${contact.firstName} ${contact.lastName}`.trim(),
      email: contact.email,
      phone: contact.phone,
      individualAddress: billingValues.billingAddress,
    });
    const audit = normalizeBillingContext(rawBillingInput, INDIVIDUAL_BILLING_AUDIT_OPTS);
    buildInvoiceDecision(audit);
    if (!audit.validation.ok) {
      Object.assign(
        nextErrors,
        mapBillingAuditErrorsToForm(audit.validation.errorsByField, {
          billingType: "individual",
        })
      );
    }
    if (Object.keys(nextErrors).length) {
      setCheckoutErrors(nextErrors);
      setError(Object.values(nextErrors)[0]);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutErrors({});
    setError("");
    try {
      const headers = await getFirebaseBearerHeader({ required: true });
      const billingDetails = buildCourseBillingDetails({
        billingValues,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        individualAddress: billingValues.billingAddress,
      });
      const response = await fetch("/api/stripe/courses/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          purchaseType: "bundle",
          bundleId,
          platform: "web",
          billingDetails,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Nu am putut iniția plata.");
      if (!data?.url) throw new Error("Stripe nu a returnat URL-ul de plată.");
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError.message || "Nu am putut iniția plata.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{bundle?.title || "Trilogie de cursuri"}</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-slate-100 pt-24">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Link href="/courses" className="text-sm font-semibold text-indigo-600">
            ← {t("coursesDetailBackToList")}
          </Link>

          {loading ? (
            <p className="mt-8 text-slate-600">{t("coursesLoading")}</p>
          ) : !bundle ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error || "Trilogia nu este disponibilă."}
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
                <div className="grid lg:grid-cols-[1.1fr_1fr]">
                  <div className="min-h-72 bg-gradient-to-br from-amber-200 to-indigo-200">
                    {bundle.thumbnailUrl ? (
                      <img
                        src={bundle.thumbnailUrl}
                        alt={bundle.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-5 p-7">
                    <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
                      Trilogie • {bundle.courses?.length || bundle.courseIds?.length || 0} mini-cursuri
                    </span>
                    <h1 className="text-3xl font-bold text-slate-900">{bundle.title}</h1>
                    <p className="leading-relaxed text-slate-600">{bundle.description}</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {formatPrice(bundle.price, bundle.currency, router.locale)}
                    </p>
                    {hasAccess ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
                        Ai acces la toate cursurile incluse.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-bold text-slate-900">Cursurile incluse</h2>
                <div className={`grid gap-6 ${(bundle.courses?.length || 0) <= 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                  {(bundle.courses || []).map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      noImageLabel={t("coursesCardNoImage")}
                      openLabel={
                        ownedCourseIds.includes(course.id) ? "Deținut" : "Vezi cursul"
                      }
                      priceLocale={router.locale || "ro-RO"}
                      freePriceLabel={t("coursesPriceFree")}
                      bundleLabel="Inclus"
                      onClick={() => router.push(`/courses/${course.id}`)}
                    />
                  ))}
                </div>
              </section>

              {!hasAccess ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Date pentru facturare</h2>
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
                    >
                      Autentifică-te pentru cumpărare
                    </button>
                  ) : (
                    <div className="mt-5 space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          ["firstName", "Prenume"],
                          ["lastName", "Nume"],
                          ["email", "Email"],
                          ["phone", "Telefon"],
                        ].map(([field, label]) => (
                          <label key={field} className="space-y-1 text-sm font-semibold text-slate-700">
                            <span>{label}</span>
                            <input
                              value={contact[field]}
                              onChange={(event) =>
                                setContact((current) => ({
                                  ...current,
                                  [field]: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                            />
                            {checkoutErrors[field] ? (
                              <span className="text-xs text-red-600">{checkoutErrors[field]}</span>
                            ) : null}
                          </label>
                        ))}
                      </div>
                      <BillingDetailsForm
                        variant="tailwind"
                        individualBillingOnly
                        hidePersonalCnp
                        billingValues={billingForm}
                        onBillingChange={(field, value) =>
                          setBillingForm((current) => ({ ...current, [field]: value }))
                        }
                        errors={checkoutErrors}
                        individualAddressValue={billingForm.billingAddress}
                        onIndividualAddressChange={(value) =>
                          setBillingForm((current) => ({
                            ...current,
                            billingAddress: value,
                          }))
                        }
                        disabled={checkoutLoading}
                      />
                      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                      <button
                        type="button"
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                        className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-60"
                      >
                        {checkoutLoading
                          ? "Se deschide plata..."
                          : `Cumpără trilogia — ${formatPrice(
                              bundle.price,
                              bundle.currency,
                              router.locale
                            )}`}
                      </button>
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
