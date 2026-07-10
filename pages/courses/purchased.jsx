import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { getFirebaseBearerHeader } from "../../utils/firebaseAuthHeaders";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function formatDate(value, locale, fallbackLabel) {
  if (!value) return fallbackLabel;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackLabel;
  return new Intl.DateTimeFormat(locale || "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatAmount(value, currency, locale, fallbackLabel) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallbackLabel;
  return new Intl.NumberFormat(locale || "ro-RO", {
    style: "currency",
    currency: currency || "RON",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function mapPurchasedApiError(status, t) {
  if (status === 401) return t("coursesErrorsAuthRequired");
  return t("coursesErrorsLoadPurchased");
}

export default function PurchasedCoursesPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [purchasedBundles, setPurchasedBundles] = useState([]);

  useEffect(() => {
    if (authLoading || currentUser) return;
    const returnUrl = encodeURIComponent(router.asPath || "/courses/purchased");
    router.push(`/login/cursuri?returnUrl=${returnUrl}`);
  }, [authLoading, currentUser, router]);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    let mounted = true;
    const loadPurchasedCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const locale = router.locale || "ro";
        const requestPurchasedCourses = async (forceRefresh = false) => {
          let authHeaders = {};
          try {
            authHeaders = await getFirebaseBearerHeader({
              required: true,
              forceRefresh,
            });
          } catch (_) {
            throw new Error(t("coursesErrorsAuthRequired"));
          }

          return fetch(
            `/api/courses/purchased?locale=${encodeURIComponent(locale)}&channel=website`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
            }
          );
        };

        let response = await requestPurchasedCourses(false);
        if (response.status === 401) {
          console.warn("[courses.purchased.page] retry_after_unauthorized", {
            uid: currentUser?.uid || "unknown",
          });
          response = await requestPurchasedCourses(true);
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(mapPurchasedApiError(response.status, t));
        }

        if (mounted) {
          setPurchases(Array.isArray(data?.purchases) ? data.purchases : []);
          setPurchasedBundles(Array.isArray(data?.purchasedBundles) ? data.purchasedBundles : []);
        }
      } catch (err) {
        console.error("[courses.purchased.page] load_fail", {
          locale: router.locale || "ro",
          uid: currentUser?.uid || "anonymous",
          message: err?.message || "unknown_error",
        });
        if (mounted) {
          setError(err.message || t("coursesErrorsLoadPurchased"));
          setPurchases([]);
          setPurchasedBundles([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPurchasedCourses();
    return () => {
      mounted = false;
    };
  }, [authLoading, currentUser, router.locale, t]);

  const resolvedLocale = useMemo(() => router.locale || "ro-RO", [router.locale]);

  return (
    <>
      <Head>
        <title>{t("coursesPurchasedSeoTitle")}</title>
      </Head>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t("coursesPurchasedHeading")}</h1>
              <p className="mt-2 text-gray-600">{t("coursesPurchasedSubtitle")}</p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t("coursesPurchasedBrowseCta")}
            </Link>
          </div>

          {authLoading || loading ? (
            <div className="text-sm text-gray-600">{t("coursesPurchasedLoading")}</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : purchases.length === 0 && purchasedBundles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900">{t("coursesPurchasedEmptyTitle")}</h2>
              <p className="mt-2 text-sm text-gray-600">{t("coursesPurchasedEmptyDescription")}</p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {t("coursesPurchasedBrowseCta")}
              </Link>
            </div>
          ) : (
            <>
              {purchasedBundles.length > 0 ? (
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Pachete premium cumpărate</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {purchasedBundles.map((bp) => {
                      const bundle = bp.bundle;
                      const purchasedAt = formatDate(bp.purchasedAt, resolvedLocale, t("coursesPurchasedUnknownDate"));
                      const amountPaid = formatAmount(bp.amountPaid, bp.currency, resolvedLocale, t("coursesPurchasedUnknownAmount"));

                      return (
                        <div
                          key={bp.bundleId}
                          className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 shadow-sm"
                        >
                          <div className="relative h-44 bg-gradient-to-br from-amber-200 to-indigo-200">
                            {bundle?.thumbnailUrl ? (
                              <img src={bundle.thumbnailUrl} alt={bundle.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl font-bold text-amber-700/60">
                                {bundle?.courses?.length || ""}
                              </div>
                            )}
                            <span className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
                              Pachet premium
                            </span>
                          </div>
                          <div className="space-y-3 p-5">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {bundle?.title || "Pachet premium indisponibil"}
                            </h3>
                            {bundle?.description ? (
                              <p className="line-clamp-2 text-sm text-gray-600">{bundle.description}</p>
                            ) : null}
                            {bundle?.courses?.length > 0 ? (
                              <ol className="space-y-1 text-sm text-slate-700">
                                {bundle.courses.map((course, idx) => (
                                  <li key={course.id}>
                                    <span className="font-semibold">{idx + 1}.</span> {course.title}
                                  </li>
                                ))}
                              </ol>
                            ) : null}
                            <div className="space-y-1 text-xs text-gray-500">
                              <p>
                                <span className="font-semibold text-gray-700">{t("coursesPurchasedPurchasedAtLabel")}:</span>{" "}
                                {purchasedAt}
                              </p>
                              <p>
                                <span className="font-semibold text-gray-700">{t("coursesPurchasedAmountLabel")}:</span>{" "}
                                {amountPaid}
                              </p>
                            </div>
                            {bundle ? (
                              <button
                                onClick={() => router.push(`/courses/bundles/${bundle.id}`)}
                                className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                              >
                                Vezi pachetul premium
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {purchases.length > 0 ? (
                <div>
                  {purchasedBundles.length > 0 ? (
                    <h2 className="mb-4 text-xl font-bold text-gray-900">Cursuri cumpărate</h2>
                  ) : null}
                  <div className="grid gap-6 md:grid-cols-2">
                    {purchases.map((purchase, index) => {
                const hasCourse = !!purchase?.course && !purchase?.courseMissing;
                const course = purchase?.course || null;
                const title = hasCourse ? course.title : t("coursesPurchasedMissingTitle");
                const description = hasCourse
                  ? course.description
                  : t("coursesPurchasedMissingDescription");
                const purchasedAt = formatDate(
                  purchase?.purchasedAt,
                  resolvedLocale,
                  t("coursesPurchasedUnknownDate")
                );
                const amountPaid = formatAmount(
                  purchase?.amountPaid,
                  purchase?.currency,
                  resolvedLocale,
                  t("coursesPurchasedUnknownAmount")
                );
                const grantedByBundle = purchase?.accessSource === "bundle";

                return (
                  <div
                    key={`${purchase?.courseId || "missing"}-${index}`}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="relative h-44 bg-gray-100">
                      {hasCourse && course?.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                          {t("coursesCardNoImage")}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        {!hasCourse && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {t("coursesPurchasedUnavailableBadge")}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-3 text-sm text-gray-600">{description}</p>

                      <div className="space-y-1 text-xs text-gray-500">
                        <p>
                          <span className="font-semibold text-gray-700">
                            {t("coursesPurchasedPurchasedAtLabel")}:
                          </span>{" "}
                          {purchasedAt}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">
                            {t("coursesPurchasedAmountLabel")}:
                          </span>{" "}
                          {grantedByBundle
                            ? t("courseBundlesAccessLabel", "Acces acordat prin pachet premium")
                            : amountPaid}
                        </p>
                      </div>

                      {hasCourse ? (
                        <button
                          onClick={() => router.push(`/courses/${course.id}`)}
                          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                          {t("coursesPurchasedOpenCourse")}
                        </button>
                      ) : (
                        <p className="mt-2 text-xs text-amber-700">
                          {t("coursesPurchasedMissingDescription")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
