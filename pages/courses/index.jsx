import React, { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CourseCard from "../../components/Courses/CourseCard";

function getCourseGridClass(courseCount = 0) {
  if (courseCount <= 1) {
    return "mx-auto grid w-full max-w-5xl grid-cols-1 gap-7";
  }
  if (courseCount === 2) {
    return "mx-auto grid w-full max-w-6xl grid-cols-1 gap-7 md:grid-cols-2";
  }
  if (courseCount === 3) {
    return "mx-auto grid w-full max-w-[96rem] grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3";
  }
  return "mx-auto grid w-full max-w-[120rem] grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function CoursesPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const coursesCardsGridClass = getCourseGridClass(courses.length);

  useEffect(() => {
    let mounted = true;

    const loadCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const locale = router.locale || "ro";
        const response = await fetch(`/api/courses?locale=${encodeURIComponent(locale)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "load_failed");
        }

        const items = Array.isArray(data?.courses) ? data.courses : [];
        if (mounted) setCourses(items);
      } catch (err) {
        console.error("[courses.page] load_fail", {
          locale: router.locale || "ro",
          message: err?.message || "unknown_error",
        });
        if (mounted) setError(t("coursesErrorsLoadCourses"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCourses();
    return () => {
      mounted = false;
    };
  }, [router.locale, t]);

  return (
    <>
      <Head>
        <title>{t("coursesSeoTitle")}</title>
      </Head>
      <Header />
      <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_100%_-40%,rgba(99,102,241,0.18),transparent),radial-gradient(800px_400px_at_-10%_0%,rgba(14,165,233,0.12),transparent)] pt-24">
        <div className="mx-auto w-full max-w-[84rem] px-4 py-10 sm:px-6 lg:px-8">
          <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-cyan-200/30 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  {t("coursesHeading")}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{t("coursesSubtitle")}</p>
              </div>
              <div className="flex max-w-sm flex-col items-start gap-2 rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-sm">
                <Link
                  href="/courses/purchased"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  {t("coursesPurchasedCta")}
                </Link>
                <p className="text-xs text-slate-500">{t("coursesPurchasedCtaHint")}</p>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-gray-600">{t("coursesLoading")}</div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              {t("coursesEmpty")}
            </div>
          ) : (
            <div className={coursesCardsGridClass}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  noImageLabel={t("coursesCardNoImage")}
                  openLabel={t("coursesHomeOpenCourse")}
                  priceLocale={router.locale || "ro-RO"}
                  freePriceLabel={t("coursesPriceFree")}
                  onClick={() => router.push(`/courses/${course.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
