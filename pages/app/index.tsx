import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import {
  detectAppStorePlatform,
  getAppStoreUrl,
  type DeviceNavigator,
} from "../../lib/appDownloadRedirect";
import {
  APPLE_APP_STORE_URL,
  GOOGLE_PLAY_APP_URL,
} from "../../lib/appStoreLinks";

const PAGE_TITLE = "Descarcă aplicația Cristina Zurba Tarot";
const PAGE_DESCRIPTION =
  "Aplicația Cristina Zurba Tarot este disponibilă în App Store și Google Play.";
const DEFAULT_SITE_URL = "https://www.cristinazurba.com";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");
const APP_PAGE_URL = `${SITE_URL}/app`;
const SOCIAL_IMAGE_URL = `${SITE_URL}/icon.png`;
const REDIRECT_DELAY_MS = 400;

const AppDownloadPage: NextPage = () => {
  useEffect(() => {
    const platform = detectAppStorePlatform(
      navigator as Navigator & DeviceNavigator
    );

    if (!platform) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.replace(getAppStoreUrl(platform));
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, []);

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={APP_PAGE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={APP_PAGE_URL} />
        <meta property="og:image" content={SOCIAL_IMAGE_URL} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta
          property="og:image:alt"
          content="Iconița aplicației Cristina Zurba Tarot"
        />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
        <meta
          name="twitter:image:alt"
          content="Iconița aplicației Cristina Zurba Tarot"
        />
      </Head>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-white sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-fuchsia-950"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl"
          aria-hidden="true"
        />

        <section className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 px-5 py-8 text-center shadow-2xl backdrop-blur-md sm:px-10 sm:py-12">
          <Image
            src="/icon.png"
            alt="Cristina Zurba Tarot"
            width={144}
            height={144}
            priority
            className="mx-auto h-28 w-28 rounded-3xl shadow-xl ring-1 ring-white/30 sm:h-36 sm:w-36"
          />

          <h1 className="mt-7 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Cristina Zurba Tarot
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-200 sm:text-lg">
            Descarcă aplicația din magazinul compatibil cu dispozitivul tău.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href={APPLE_APP_STORE_URL}
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-white px-5 py-3 text-base font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-label="Descarcă Cristina Zurba Tarot din App Store"
            >
              Descarcă din App Store
            </a>
            <a
              href={GOOGLE_PLAY_APP_URL}
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/25 bg-slate-900/70 px-5 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-label="Descarcă Cristina Zurba Tarot din Google Play"
            >
              Descarcă din Google Play
            </a>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-300">
            Dacă redirecționarea automată nu pornește, alege magazinul dorit.
          </p>
        </section>
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "ro", ["common"])),
  },
});

export default AppDownloadPage;
