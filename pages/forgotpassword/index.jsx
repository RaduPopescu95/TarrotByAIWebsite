import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AuthFunnelShell from "../../components/auth/AuthFunnelShell";
import { authentication } from "../../firebase";
import { emailWithoutSpace } from "../../utils/strintText";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { sanitizeInternalReturnUrl } from "../../lib/navigation";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const rawReturnUrl = Array.isArray(router.query?.returnUrl)
    ? router.query.returnUrl[0]
    : router.query?.returnUrl;
  const loginHref = `/login?returnUrl=${encodeURIComponent(sanitizeInternalReturnUrl(rawReturnUrl || "/"))}`;
  const registerHref = `/register?returnUrl=${encodeURIComponent(sanitizeInternalReturnUrl(rawReturnUrl || "/"))}`;

  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messageKind, setMessageKind] = React.useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = emailWithoutSpace(data.get("email"));

    setIsLoading(true);
    setMessage("");
    setMessageKind("");

    try {
      await sendPasswordResetEmail(authentication, email);
      setMessageKind("success");
      setMessage(t("forgotPasswordSuccessMessage"));
    } catch (error) {
      setMessageKind("error");
      setMessage(handleFirebaseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t("forgotPasswordTitle")}</title>
        <meta name="description" content={t("forgotPasswordDescription")} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <AuthFunnelShell
        topSlot={
          <Link
            href={loginHref}
            className="mx-auto mb-4 inline-flex w-full max-w-6xl shrink-0 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 lg:mb-4 xl:max-w-7xl"
          >
            <span aria-hidden>←</span>
            {t("backToLogin")}
          </Link>
        }
      >
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:items-start lg:gap-y-8 lg:px-10 lg:py-10 xl:gap-x-14 xl:px-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Image
              src="/LogoPngTransparent.png"
              width={120}
              height={120}
              alt=""
              className="mb-4 h-[88px] w-[88px] object-contain sm:h-24 sm:w-24 lg:mb-3 lg:h-28 lg:w-28 xl:h-32 xl:w-32"
              priority
            />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl lg:text-2xl">
              {t("resetPassword")}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 lg:mt-2 lg:max-w-none lg:text-sm lg:leading-snug">
              {t("forgotPasswordDescription")}
            </p>
          </div>

          <div className="mt-8 lg:mt-0">
            {message ? (
              <div
                role="alert"
                className={
                  messageKind === "success"
                    ? "mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                    : "mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
                }
              >
                {message}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("email")}
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("email")}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t("resetPassword")}
                  </span>
                ) : (
                  t("resetPassword")
                )}
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-3 text-center text-sm lg:mt-6 lg:flex-row lg:justify-between lg:gap-4 lg:text-left">
              <Link
                href={loginHref}
                className="shrink-0 font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline lg:text-sm"
              >
                {t("alreadyAccount")} — {t("loginNow")}
              </Link>
              <Link
                href={registerHref}
                className="font-semibold text-indigo-700 underline-offset-2 hover:underline lg:text-right lg:text-sm"
              >
                {t("dntHaveAccount")} {t("signUp")}
              </Link>
            </div>
          </div>
        </section>
      </AuthFunnelShell>
    </>
  );
}
