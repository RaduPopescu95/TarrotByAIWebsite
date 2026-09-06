import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import COMPANY_LEGAL from "../../data/companyLegal";

const COPY = {
  ro: {
    title: "Politica de confidențialitate | Cristina Zurba",
    heading: "Politica de confidențialitate",
    updated: "Ultima actualizare: 6 septembrie 2026",
    intro: "Această politică explică modul în care SPIRIT SOARE ȘI LUNĂ S.R.L. prelucrează datele personale când folosești site-ul și aplicația Cristina Zurba.",
    controller: "Operatorul datelor",
    data: "Date pe care le putem prelucra",
    dataBody: "În funcție de funcțiile utilizate, putem prelucra date de cont (nume, email, identificator de utilizator), date de profil, analize și conținut creat în aplicație, imagini încărcate voluntar, locație aproximativă sau oraș, date despre interacțiunile cu aplicația, identificatori de dispozitiv și date tehnice sau de diagnosticare.",
    purposes: "De ce folosim datele",
    purposesBody: "Folosim datele pentru autentificare, furnizarea analizelor și conținutului solicitat, sincronizarea contului între dispozitive, suport, siguranță, diagnosticarea erorilor, prevenirea abuzului și îmbunătățirea aplicației. Datele de contact nu sunt cerute din nou după Sign in with Apple dacă Apple sau contul existent le furnizează deja.",
    partners: "Furnizori și publicitate",
    partnersBody: "Folosim Firebase (Authentication, Firestore și Storage) pentru conturi, datele aplicației și fișierele încărcate; Google AdMob și User Messaging Platform pentru afișarea și gestionarea reclamelor; și Sentry pentru raportarea erorilor. Acești furnizori pot prelucra date tehnice, identificatori sau date de utilizare în numele nostru, conform propriilor politici.",
    tracking: "Reclame, GDPR și App Tracking Transparency",
    trackingBody: "Cerem consimțământul GDPR atunci când este necesar înainte de solicitarea reclamelor. Pe iOS, cerem permisiunea App Tracking Transparency numai când utilizatorul este eligibil pentru reclame personalizate. Dacă refuzi consimțământul sau permisiunea ATT, aplicația rămâne funcțională și poate afișa numai reclame nepersonalizate. Preferințele pot fi redeschise din Settings → Privacy options.",
    apple: "Sign in with Apple",
    appleBody: "Când alegi Sign in with Apple, putem primi identificatorul Apple și, la prima autorizare, numele sau adresa de email aleasă de tine. Apple poate furniza o adresă private relay. La autentificările ulterioare, Apple poate să nu mai trimită numele; păstrăm datele de profil deja disponibile pentru funcționarea contului.",
    retention: "Păstrarea și ștergerea datelor",
    retentionBody: "Păstrăm datele cât timp sunt necesare pentru funcționarea contului, furnizarea serviciului, soluționarea cererilor sau respectarea obligațiilor legale. Poți solicita ștergerea contului, profilului, analizelor și imaginilor asociate. Putem păstra numai informațiile necesare dacă legea ne obligă.",
    rights: "Drepturile și opțiunile tale",
    rightsBody: "Poți solicita acces la date, corectarea lor sau ștergerea lor. Pentru preferințele privind reclame, folosește opțiunile din aplicație și setările iOS. Pentru cereri privind datele personale, folosește pagina noastră de privacy choices; răspundem în maximum 30 de zile, sub rezerva verificării identității.",
    changes: "Modificări și contact",
    changesBody: "Putem actualiza această politică pentru a reflecta modificări ale serviciilor sau obligațiilor legale. Vom publica versiunea actualizată pe această pagină.",
    choices: "Gestionează opțiunile de confidențialitate",
  },
  en: {
    title: "Privacy Policy | Cristina Zurba",
    heading: "Privacy Policy",
    updated: "Last updated: September 6, 2026",
    intro: "This policy explains how SPIRIT SOARE ȘI LUNĂ S.R.L. processes personal data when you use the Cristina Zurba website and application.",
    controller: "Data controller",
    data: "Data we may process",
    dataBody: "Depending on the features you use, we may process account data (name, email address and user identifier), profile data, analyses and content created in the app, voluntarily uploaded images, approximate location or city, app interaction data, device identifiers, and technical or diagnostic data.",
    purposes: "Why we use data",
    purposesBody: "We use data for authentication, providing requested analyses and content, account synchronisation across devices, support, security, error diagnosis, abuse prevention and service improvement. We do not require contact data again after Sign in with Apple when Apple or an existing account already provides it.",
    partners: "Service providers and advertising",
    partnersBody: "We use Firebase (Authentication, Firestore and Storage) for accounts, app data and uploaded files; Google AdMob and User Messaging Platform for advertising and consent management; and Sentry for error reporting. These providers may process technical data, identifiers or usage data on our behalf, under their own policies.",
    tracking: "Advertising, GDPR and App Tracking Transparency",
    trackingBody: "We request GDPR consent where required before requesting ads. On iOS, we request App Tracking Transparency permission only when a user is eligible for personalised advertising. If you decline consent or ATT permission, the app remains functional and may show only non-personalised ads. Choices can be reopened from Settings → Privacy options.",
    apple: "Sign in with Apple",
    appleBody: "When you choose Sign in with Apple, we may receive your Apple identifier and, on first authorisation, the name or email address you choose to share. Apple may provide a private relay address. On later sign-ins Apple may not send your name again; we retain available profile data to operate the account.",
    retention: "Data retention and deletion",
    retentionBody: "We retain data for as long as needed to operate the account, provide the service, address requests, or comply with legal obligations. You can request deletion of the account, profile, analyses and associated images. We may retain only information that we are legally required to keep.",
    rights: "Your rights and choices",
    rightsBody: "You may request access to, correction of, or deletion of your data. For advertising choices, use in-app options and iOS settings. For personal data requests, use our privacy choices page; we respond within 30 days, subject to identity verification.",
    changes: "Changes and contact",
    changesBody: "We may update this policy to reflect changes to services or legal obligations. We will publish the current version on this page.",
    choices: "Manage your privacy choices",
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

export default function PrivacyPolicyPage({ contentLanguage }) {
  const router = useRouter();
  const copy = COPY[contentLanguage] || COPY.en;
  const sections = [
    [copy.controller, `${COMPANY_LEGAL.legalName}, CUI ${COMPANY_LEGAL.cui}, ${COMPANY_LEGAL.registeredOffice}. Contact: ${COMPANY_LEGAL.supportEmail}.`],
    [copy.data, copy.dataBody],
    [copy.purposes, copy.purposesBody],
    [copy.partners, copy.partnersBody],
    [copy.tracking, copy.trackingBody],
    [copy.apple, copy.appleBody],
    [copy.retention, copy.retentionBody],
    [copy.rights, copy.rightsBody],
    [copy.changes, copy.changesBody],
  ];

  return (
    <>
      <Head>
        <title>{copy.title}</title>
        <meta name="description" content={copy.intro} />
      </Head>
      <Header />
      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 sm:px-8">
        <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{copy.heading}</h1>
          <p className="mt-2 text-sm text-slate-500">{copy.updated}</p>
          <p className="mt-6 leading-relaxed text-slate-700">{copy.intro}</p>
          {sections.map(([heading, body]) => (
            <section className="mt-8" key={heading}>
              <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
              <p className="mt-3 leading-relaxed text-slate-700">{body}</p>
            </section>
          ))}
          <Link href="/privacy-choices" locale={router.locale} className="mt-8 inline-block font-semibold text-indigo-700 underline-offset-2 hover:underline">
            {copy.choices}
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
