import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { signInWithEmailAndPassword } from "firebase/auth";
import AuthFunnelShell from "../../components/auth/AuthFunnelShell";
import { useAuth } from "../../context/AuthContext";
import { emailWithoutSpace } from "../../utils/strintText";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { authentication } from "../../firebase";
import { sanitizeInternalReturnUrl, consumeAuthReturnUrl, persistAuthReturnUrl } from "../../lib/navigation";
import { resolveGoogleRedirectResult } from "../../utils/googleAuthWeb";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function VideotecaLoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { setCurrentUser, loginWithGoogle, finalizeGoogleUserSession } = useAuth();

  const [message, setMessage] = React.useState("");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isResolvingGoogleRedirect, setIsResolvingGoogleRedirect] = React.useState(false);

  const rawReturnUrl = Array.isArray(router.query?.returnUrl)
    ? router.query.returnUrl[0]
    : router.query?.returnUrl;

  const safeReturnUrl = React.useMemo(
    () => sanitizeInternalReturnUrl(rawReturnUrl || "/"),
    [rawReturnUrl],
  );

  React.useEffect(() => {
    if (!router.isReady) return;

    let mounted = true;

    const resolveGoogleRedirect = async () => {
      setIsResolvingGoogleRedirect(true);
      try {
        const redirectResult = await resolveGoogleRedirectResult(authentication);
        if (!mounted) return;
        if (redirectResult?.status === "signed_in" && redirectResult?.user) {
          await finalizeGoogleUserSession(redirectResult.user);
          const targetUrl = consumeAuthReturnUrl(safeReturnUrl);
          await router.replace(targetUrl);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("[login/videoteca] google_redirect_fail", error?.message || error);
        setShowSnackback(true);
        setMessage(t("loginGoogleError", { defaultValue: "Google sign-in failed. Please try again." }));
      } finally {
        if (mounted) setIsResolvingGoogleRedirect(false);
      }
    };

    resolveGoogleRedirect();

    return () => {
      mounted = false;
    };
  }, [router.isReady, safeReturnUrl, t, finalizeGoogleUserSession]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    const data = new FormData(event.currentTarget);
    const email = emailWithoutSpace(data.get("email"));
    const password = data.get("password");

    signInWithEmailAndPassword(authentication, email, password)
      .then(async (userCredentials) => {
        setCurrentUser(userCredentials.user);
        await router.push(safeReturnUrl);
        setIsLoading(false);
      })
      .catch((error) => {
        const errorMessage = handleFirebaseAuthError(error);
        setShowSnackback(true);
        setMessage(errorMessage);
        setIsLoading(false);
      });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setShowSnackback(false);
    try {
      persistAuthReturnUrl(safeReturnUrl);
      const result = await loginWithGoogle({ returnUrl: safeReturnUrl });
      if (result?.status === "signed_in") {
        await router.replace(safeReturnUrl);
      }
    } catch (error) {
      console.error("[login/videoteca] google_sign_in_fail", error?.message || error);
      setShowSnackback(true);
      setMessage(t("loginGoogleError", { defaultValue: "Google sign-in failed. Please try again." }));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isActionBusy = isLoading || isGoogleLoading || isResolvingGoogleRedirect;

  const googleBtn = t("loginGoogleButton", { defaultValue: "Continue with Google" });
  const googleLoading = t("loginGoogleLoading", { defaultValue: "Starting Google sign-in…" });

  return (
    <>
      <Head>
        <title>{t("videoLoginTitle")}</title>
        <meta name="description" content={t("videoLoginDescription")} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <AuthFunnelShell
        topSlot={
          <Link
            href="/videouri"
            className="mx-auto mb-4 inline-flex w-full max-w-6xl shrink-0 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 lg:mb-4 xl:max-w-7xl"
          >
            <span aria-hidden>←</span>
            {t("videoLoginBackToVideoteca")}
          </Link>
        }
      >
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6 lg:px-10 lg:py-8 xl:gap-x-14 xl:px-12">
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
                  {t("videoLoginHeadline")}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 lg:mt-2 lg:max-w-none lg:text-sm lg:leading-snug">
                  {t("videoLoginSubhead")}
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-left text-sm text-slate-600 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:space-y-2 lg:self-start lg:text-sm">
                {[t("videoLoginPoint1"), t("videoLoginPoint2"), t("videoLoginPoint3")].map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 lg:mt-2"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
                {showSnackback && message ? (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 lg:mb-3"
                  >
                    {message}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isActionBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGoogleLoading || isResolvingGoogleRedirect ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                      {googleLoading}
                    </span>
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {googleBtn}
                    </>
                  )}
                </button>

                <div className="relative py-5 sm:py-4 lg:py-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
                    <span className="bg-white px-3">{t("videoLoginOrDivider")}</span>
                  </div>
                </div>

                <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="videoteca-login-email" className="sr-only">
                      {t("email")}
                    </label>
                    <input
                      id="videoteca-login-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={t("email")}
                      disabled={isActionBusy}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label htmlFor="videoteca-login-password" className="sr-only">
                      {t("password")}
                    </label>
                    <input
                      id="videoteca-login-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder={t("password")}
                      disabled={isActionBusy}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isActionBusy}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        {t("loginNow")}
                      </span>
                    ) : (
                      t("loginNow")
                    )}
                  </button>
                </form>

                <div className="mt-5 flex flex-col gap-3 text-center text-sm sm:mt-6 lg:mt-5 lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:text-left">
                  <button
                    type="button"
                    onClick={() => router.push("/forgotpassword")}
                    className="shrink-0 font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline lg:text-sm"
                  >
                    {t("forgotPassword")}
                  </button>
                  <p className="text-slate-600 lg:flex-1 lg:min-w-0 lg:text-right lg:text-sm">
                    {t("dntHaveAccount")}{" "}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/register?returnUrl=${encodeURIComponent(safeReturnUrl)}`)
                      }
                      className="font-semibold text-indigo-700 underline-offset-2 hover:underline"
                    >
                      {t("signUp")}
                    </button>
                  </p>
                </div>
              </div>
        </section>

        <p className="mx-auto mt-6 text-center text-[11px] leading-relaxed text-slate-500 sm:text-xs lg:mt-4 lg:leading-snug">
          {t("videoLoginFootnote")}
        </p>
      </AuthFunnelShell>
    </>
  );
}
