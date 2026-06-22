import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { emailWithoutSpace } from "../../utils/strintText";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { signInWithEmailAndPassword } from "firebase/auth";
import { authentication } from "../../firebase";
import AuthFunnelShell from "../../components/auth/AuthFunnelShell";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import { sanitizeInternalReturnUrl, persistAuthReturnUrl } from "../../lib/navigation";
import { useAuthFunnelRedirect } from "../../hooks/useAuthFunnelRedirect";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60 sm:text-sm";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function SignInSide() {
  const { setAsGuestUser, finalizeEmailPasswordSession, loginWithGoogle } = useAuth();
  const [message, setMessage] = React.useState("email");
  const [showSnackback, setShowSnackback] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const { t } = useTranslation("common");
  const router = useRouter();
  const rawReturnUrl = Array.isArray(router.query?.returnUrl)
    ? router.query.returnUrl[0]
    : router.query?.returnUrl;
  const safeReturnUrl = React.useMemo(
    () => sanitizeInternalReturnUrl(rawReturnUrl || "/"),
    [rawReturnUrl]
  );
  const { authBootstrapReady } = useAuthFunnelRedirect(safeReturnUrl);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setShowSnackback(false);
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    const emailNew = emailWithoutSpace(email);

    try {
      persistAuthReturnUrl(safeReturnUrl);
      const userCredentials = await signInWithEmailAndPassword(
        authentication,
        emailNew,
        password
      );
      await finalizeEmailPasswordSession(userCredentials.user);
    } catch (error) {
      const errorMessage = handleFirebaseAuthError(error);
      setShowSnackback(true);
      setMessage(errorMessage);
      console.error("[login] email_sign_in_fail", {
        message: error?.message || "unknown_error",
        code: error?.code || "unknown_code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setShowSnackback(false);
    try {
      persistAuthReturnUrl(safeReturnUrl);
      const authResult = await loginWithGoogle({ returnUrl: safeReturnUrl });
      console.log("[login] google_sign_in_result", {
        status: authResult?.status,
        uid: authResult?.user?.uid || null,
      });
      if (authResult?.status !== "redirecting") {
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error("[login] google_sign_in_fail", {
        message: error?.message || "unknown_error",
        code: error?.code || "unknown_code",
      });
      setShowSnackback(true);
      setMessage(t("loginGoogleError"));
      setIsGoogleLoading(false);
    }
  };

  const handleLoginAsGuest = async () => {
    try {
      setAsGuestUser(true);
      router.push(safeReturnUrl);
      console.log("Utilizatorul este acum setat ca guest user.");
    } catch (error) {
      console.error(
        "Eroare la setarea guest user-ului în AsyncStorage:",
        error
      );
    }
  };

  const isGoogleActionLoading = isGoogleLoading || !authBootstrapReady;
  const registerHref = `/register?returnUrl=${encodeURIComponent(safeReturnUrl)}`;

  return (
    <>
      <Head>
        <title>{t("loginTitle")}</title>
        <meta name="description" content={t("loginDescription")} />
        <meta name="robots" content="noindex,nofollow" />
        <meta property="og:title" content={t("loginTitle")} />
        <meta property="og:description" content={t("loginDescription")} />
      </Head>

      <AuthFunnelShell>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-5">
          <section className="flex flex-col px-5 py-6 sm:px-8 sm:py-8 lg:col-span-2 lg:justify-center lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
                <Image
                  src="/LogoPngTransparent.png"
                  width={120}
                  height={120}
                  alt="Cristina Zurba Logo"
                  className="mb-3 h-20 w-20 object-contain sm:h-24 sm:w-24"
                  priority
                />
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {t("login")}
                </h1>
              </div>

              {showSnackback && message ? (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {message}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("email")} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className={inputClassName}
                    placeholder="exemplu@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {t("password")} *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={inputClassName}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLoginAsGuest}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl border-2 border-indigo-500 bg-transparent py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("loginNowNoAccount")}
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {t("loginNow")}
                    </span>
                  ) : (
                    t("loginNow")
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleActionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                      {t("loginGoogleLoading")}
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
                      {t("loginGoogleButton")}
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-3 pt-1 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <button
                    type="button"
                    onClick={() => router.push("/forgotpassword")}
                    className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                  >
                    {t("forgotPassword")}
                  </button>
                  <p className="text-slate-600">
                    {t("dntHaveAccount")}{" "}
                    <Link
                      href={registerHref}
                      className="font-semibold text-indigo-700 underline-offset-2 hover:underline"
                    >
                      {t("signUp")}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </section>

          <aside className="hidden flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-400 px-8 py-10 lg:col-span-3 lg:flex xl:px-12">
            <div className="flex max-w-xl flex-col items-center gap-8 xl:flex-row xl:items-center xl:gap-10">
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/appmarketing.png"
                  width={320}
                  height={320}
                  alt="App Marketing"
                  className="h-auto w-full max-w-[240px] object-contain xl:max-w-[280px]"
                />
                <h2 className="mt-4 text-lg font-light text-white xl:text-xl">
                  Descarcă{" "}
                  <span className="font-bold">aplicația acum</span>
                </h2>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <Link href="https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot">
                      <img
                        src="/gplay.png"
                        alt="Google Play"
                        className="h-14 w-14 object-contain"
                      />
                    </Link>
                    <p className="mt-1 rounded-lg bg-slate-900/50 px-2 py-0.5 text-xs text-white">
                      Android
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Link href="https://apps.apple.com/ro/app/cristina-zurba/id6475713937">
                      <img
                        src="/appstore.png"
                        alt="App Store"
                        className="h-14 w-14 object-contain"
                      />
                    </Link>
                    <p className="mt-1 rounded-lg bg-slate-900/50 px-2 py-0.5 text-xs text-white">
                      iOS
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <Image
                  src="/lucky-deco.png"
                  width={220}
                  height={52}
                  alt=""
                  className="h-auto w-full max-w-[180px] object-contain"
                />
                <Image
                  src="/onboardImg.png"
                  width={280}
                  height={320}
                  alt="Tarot reading"
                  className="my-3 h-auto w-full max-w-[220px] object-contain xl:max-w-[260px]"
                />
                <p className="text-3xl font-bold text-white xl:text-4xl">Tarot by AI</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:hidden">
          <p className="mb-3 text-center text-sm font-medium text-slate-700">
            Descarcă aplicația
          </p>
          <div className="flex items-center justify-center gap-8">
            <Link
              href="https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot"
              className="flex flex-col items-center"
            >
              <img src="/gplay.png" alt="Google Play" className="h-12 w-12 object-contain" />
              <span className="mt-1 text-xs text-slate-500">Android</span>
            </Link>
            <Link
              href="https://apps.apple.com/ro/app/cristina-zurba/id6475713937"
              className="flex flex-col items-center"
            >
              <img src="/appstore.png" alt="App Store" className="h-12 w-12 object-contain" />
              <span className="mt-1 text-xs text-slate-500">iOS</span>
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 text-center text-[11px] leading-relaxed text-slate-500 sm:text-xs">
          Copyright © Cristina Zurba {new Date().getFullYear()}.{" "}
          dezvoltat de{" "}
          <Link
            href="https://webappdynamicx.ro/"
            className="text-indigo-700 underline-offset-2 hover:underline"
          >
            Web App Dynamicx
          </Link>
          .
        </p>
      </AuthFunnelShell>
    </>
  );
}
