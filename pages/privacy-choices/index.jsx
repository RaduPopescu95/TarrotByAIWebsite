import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import COMPANY_LEGAL from "../../data/companyLegal";

const COPY = {
  ro: {
    title: "Opțiuni de confidențialitate | Cristina Zurba",
    heading: "Opțiuni de confidențialitate",
    intro: "Aici poți gestiona preferințele de publicitate și poți trimite o cerere privind datele tale personale.",
    adsTitle: "Preferințe pentru reclame",
    adsBody: "În aplicația Cristina Zurba pe iOS sau Android poți redeschide opțiunile de publicitate din Settings → Privacy options. Pentru permisiunea App Tracking Transparency, disponibilă numai pe iOS, mergi la Settings → Privacy & Security → Tracking.",
    requestTitle: "Cerere privind datele personale",
    requestBody: "Poți solicita ștergerea completă a contului și a datelor asociate, acces la date sau corectarea lor. Pentru ștergere, vom elimina contul, profilul, analizele și imaginile asociate, cu excepția informațiilor pe care legea ne obligă să le păstrăm.",
    typeLabel: "Tipul cererii",
    delete: "Ștergere cont și date asociate",
    access: "Acces la datele mele",
    rectify: "Corectare date personale",
    emailLabel: "Adresa de email a contului",
    detailsLabel: "Detalii suplimentare (opțional)",
    detailsPlaceholder: "Spune-ne ce dorești să verificăm sau să corectăm.",
    submit: "Trimite cererea",
    sending: "Se trimite…",
    success: "Cererea a fost primită. Vom verifica identitatea contului și îți vom răspunde în maximum 30 de zile.",
    error: "Cererea nu a putut fi trimisă. Încearcă din nou sau scrie-ne la",
    privacyLink: "Citește Politica de confidențialitate",
  },
  en: {
    title: "Privacy choices | Cristina Zurba",
    heading: "Privacy choices",
    intro: "Manage advertising preferences and send a request about your personal data.",
    adsTitle: "Advertising preferences",
    adsBody: "In the Cristina Zurba app on iOS or Android, you can reopen advertising choices from Settings → Privacy options. App Tracking Transparency is available only on iOS; to change it, go to iOS Settings → Privacy & Security → Tracking.",
    requestTitle: "Personal data request",
    requestBody: "You can request complete deletion of your account and associated data, access to your data, or correction of your data. For deletion, we remove the account, profile, analyses and associated images, except information we are legally required to retain.",
    typeLabel: "Request type",
    delete: "Delete account and associated data",
    access: "Access my data",
    rectify: "Correct my personal data",
    emailLabel: "Account email address",
    detailsLabel: "Additional details (optional)",
    detailsPlaceholder: "Tell us what you would like us to review or correct.",
    submit: "Send request",
    sending: "Sending…",
    success: "Your request was received. We will verify account ownership and reply within 30 days.",
    error: "We could not send your request. Please try again or email us at",
    privacyLink: "Read the Privacy Policy",
  },
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      contentLanguage: locale === "ro" ? "ro" : "en",
    },
  };
}

export default function PrivacyChoicesPage({ contentLanguage }) {
  const router = useRouter();
  const copy = COPY[contentLanguage] || COPY.en;
  const [form, setForm] = useState({ email: "", requestType: "delete", message: "", company: "" });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "sending", message: "" });
    try {
      const response = await fetch("/api/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed");
      setForm({ email: "", requestType: "delete", message: "", company: "" });
      setStatus({ type: "success", message: copy.success });
    } catch (error) {
      setStatus({ type: "error", message: error.message || copy.error });
    }
  };

  return (
    <>
      <Head>
        <title>{copy.title}</title>
        <meta name="description" content={copy.intro} />
        <meta name="robots" content="index,follow" />
      </Head>
      <Header />
      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{copy.heading}</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-700">{copy.intro}</p>
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{copy.adsTitle}</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{copy.adsBody}</p>
          </section>
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{copy.requestTitle}</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{copy.requestBody}</p>
            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="privacy-request-type">{copy.typeLabel}</label>
                <select id="privacy-request-type" className="mt-2 w-full rounded-lg border border-slate-300 p-3" value={form.requestType} onChange={(event) => updateField("requestType", event.target.value)}>
                  <option value="delete">{copy.delete}</option>
                  <option value="access">{copy.access}</option>
                  <option value="rectify">{copy.rectify}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="privacy-email">{copy.emailLabel}</label>
                <input id="privacy-email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-slate-300 p-3" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="privacy-details">{copy.detailsLabel}</label>
                <textarea id="privacy-details" rows={4} maxLength={2000} className="mt-2 w-full rounded-lg border border-slate-300 p-3" placeholder={copy.detailsPlaceholder} value={form.message} onChange={(event) => updateField("message", event.target.value)} />
              </div>
              <div className="hidden" aria-hidden="true">
                <label htmlFor="privacy-company">Company</label>
                <input id="privacy-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={(event) => updateField("company", event.target.value)} />
              </div>
              <button type="submit" disabled={status.type === "sending"} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                {status.type === "sending" ? copy.sending : copy.submit}
              </button>
              {status.type === "success" ? <p className="text-sm font-medium text-emerald-700" role="status">{status.message}</p> : null}
              {status.type === "error" ? <p className="text-sm font-medium text-red-700" role="alert">{copy.error} <a className="underline" href={`mailto:${COMPANY_LEGAL.supportEmail}`}>{COMPANY_LEGAL.supportEmail}</a>.</p> : null}
            </form>
          </section>
          <Link href="/privacypolicy" locale={router.locale} className="mt-6 inline-block font-semibold text-indigo-700 underline-offset-2 hover:underline">
            {copy.privacyLink}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
