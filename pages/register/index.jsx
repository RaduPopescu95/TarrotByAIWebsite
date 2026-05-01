import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { validateEmail } from "../../utils/commonUtils";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { authentication, db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { handleFirebaseAuthError } from "../../utils/authUtils";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import AuthFunnelShell from "../../components/auth/AuthFunnelShell";
import { sanitizeInternalReturnUrl } from "../../lib/navigation";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

const bulletInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60";

export default function RegisterPage() {
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [showErrorBanner, setShowErrorBanner] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const { t } = useTranslation("common");
  const { setUserData } = useAuth();
  const router = useRouter();
  const rawReturnUrl = Array.isArray(router.query?.returnUrl)
    ? router.query.returnUrl[0]
    : router.query?.returnUrl;
  const safeReturnUrl = React.useMemo(
    () => sanitizeInternalReturnUrl(rawReturnUrl || "/"),
    [rawReturnUrl],
  );

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    lastName: "",
    firstName: "",
  });

  const isButtonDisabled =
    !formData.email ||
    !formData.password ||
    formData.password !== formData.confirmPassword ||
    !formData.firstName ||
    !formData.lastName;

  const loginHref = `/login?returnUrl=${encodeURIComponent(safeReturnUrl)}`;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowErrorBanner(false);
    let hasError = false;

    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    const confirmPassword = data.get("confirmPassword");
    const last_name = data.get("lastName");
    const first_name = data.get("firstName");

    const isValidEmail = validateEmail(email);
    if (!isValidEmail) {
      setEmailError(t("firebaseErrorInvalidEmail"));
      hasError = true;
    } else {
      setEmailError("");
    }

    if (password !== confirmPassword) {
      setPasswordError(t("passDontMatch"));
      hasError = true;
    } else if (typeof password === "string" && password.length < 6) {
      setPasswordError(t("firebaseErrorWeakPassword"));
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      const userCredentials = await createUserWithEmailAndPassword(authentication, email, password);
      const user = userCredentials.user;
      const value = {
        owner_uid: user.uid,
        first_name: first_name,
        last_name: last_name,
        email,
      };
      setUserData({ ...value });
      await setDoc(doc(db, "Users", user.uid), value);
      await router.push(safeReturnUrl);
    } catch (error) {
      setShowErrorBanner(true);
      setMessage(handleFirebaseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const points = React.useMemo(
    () => [t("createAccountCTAMessage"), t("createAccountCTA"), t("discoverSpiritualWisdom")],
    [t],
  );

  return (
    <>
      <Head>
        <title>{t("registerTitle")}</title>
        <meta name="description" content={t("registerDescription")} />
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
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl lg:text-2xl">{t("signUp")}</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 lg:mt-2 lg:max-w-none lg:text-sm lg:leading-snug">
              {t("registerDescription")}
            </p>
          </div>

          <ul className="mt-6 space-y-2.5 text-left text-sm text-slate-600 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:space-y-2 lg:self-start lg:text-sm">
            {points.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 lg:mt-2" aria-hidden />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
            {showErrorBanner && message ? (
              <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                {message}
              </div>
            ) : null}

            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-first-name" className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("firstName")}
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    placeholder={t("firstName")}
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={bulletInputClass}
                  />
                </div>
                <div>
                  <label htmlFor="reg-last-name" className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("lastName")}
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    name="lastName"
                    required
                    autoComplete="family-name"
                    placeholder={t("lastName")}
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={bulletInputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("email")}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder={t("email")}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${bulletInputClass} ${emailError ? "border-red-300 focus:border-red-400 focus:ring-red-50" : ""}`}
                />
                {emailError ? <p className="mt-1 text-xs text-red-600">{emailError}</p> : null}
              </div>

              <div>
                <label htmlFor="reg-password" className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("password")}
                </label>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  placeholder={t("password")}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${bulletInputClass} ${passwordError ? "border-red-300 focus:border-red-400 focus:ring-red-50" : ""}`}
                />
              </div>

              <div>
                <label htmlFor="reg-confirm" className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("confirmPassword")}
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  placeholder={t("confirmPassword")}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${bulletInputClass} ${passwordError ? "border-red-300 focus:border-red-400 focus:ring-red-50" : ""}`}
                />
                {passwordError ? <p className="mt-1 text-xs text-red-600">{passwordError}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isButtonDisabled || isLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {t("signUp")}
                  </span>
                ) : (
                  t("signUp")
                )}
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-3 text-center text-sm sm:mt-6 lg:mt-5 lg:flex-row lg:justify-between lg:gap-4 lg:text-left">
              <Link href="/forgotpassword" className="shrink-0 font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline lg:text-sm">
                {t("forgotPassword")}
              </Link>
              <p className="text-slate-600 lg:flex-1 lg:min-w-0 lg:text-right lg:text-sm">
                {t("alreadyAccount")}{" "}
                <Link href={loginHref} className="font-semibold text-indigo-700 underline-offset-2 hover:underline">
                  {t("loginNow")}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </AuthFunnelShell>
    </>
  );
}
