import React from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { COMPANY_LEGAL } from "../../data/companyLegal";
import { Mail, Building2, MapPin, Shield } from "lucide-react";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function SupportPage() {
  const { t } = useTranslation("common");
  const mailto = `mailto:${COMPANY_LEGAL.supportEmail}`;

  return (
    <>
      <Head>
        <title>{t("supportPageTitle")}</title>
        <meta name="description" content={t("supportPageDescription")} />
        <meta name="og:title" content={t("supportPageTitle")} />
        <meta name="og:description" content={t("supportPageDescription")} />
      </Head>

      <Header />

      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {t("supportPageHeading")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            {t("supportOrgIntro", { legalName: COMPANY_LEGAL.legalName, brandName: COMPANY_LEGAL.brandName })}
          </p>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Building2 className="h-5 w-5" aria-hidden />
              <h2 className="text-lg font-semibold">{t("supportCompanyDetails")}</h2>
            </div>
            <dl className="space-y-3 text-sm text-slate-700">
              <div>
                <dt className="font-medium text-slate-500">{t("supportLabelLegalName")}</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{COMPANY_LEGAL.legalName}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t("supportLabelCui")}</dt>
                <dd className="mt-0.5">{COMPANY_LEGAL.cui}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t("supportLabelTradeRegister")}</dt>
                <dd className="mt-0.5">{COMPANY_LEGAL.tradeRegisterNumber}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t("supportLabelEuid")}</dt>
                <dd className="mt-0.5">{COMPANY_LEGAL.euid}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t("supportLabelAdministrator")}</dt>
                <dd className="mt-0.5">{COMPANY_LEGAL.administrator}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 font-medium text-slate-500">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {t("supportLabelRegisteredOffice")}
                </dt>
                <dd className="mt-0.5">{COMPANY_LEGAL.registeredOffice}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Mail className="h-5 w-5" aria-hidden />
              <h2 className="text-lg font-semibold">{t("supportContactHeading")}</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {t("supportContactBody")}
            </p>
            <a
              href={mailto}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {COMPANY_LEGAL.supportEmail}
            </a>
          </section>

          <section className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/about" className="font-medium text-indigo-700 underline-offset-2 hover:underline">
              {t("about")}
            </Link>
            <Link
              href="/privacypolicy"
              className="inline-flex items-center gap-1 font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              <Shield className="h-4 w-4" aria-hidden />
              {t("privacyPolicy")}
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
