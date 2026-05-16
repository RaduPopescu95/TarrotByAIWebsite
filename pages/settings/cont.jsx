import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { handleLogout } from "../../utils/authUtils";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import AccountProfileForm from "../../components/settings/AccountProfileForm";

function Copyright() {
  return (
    <div style={styles.copyrightContainer}>
      <p style={styles.copyrightText}>
        {"Copyright © "}
        <span>Cristina Zurba</span> {new Date().getFullYear()}
        {"."}
      </p>
      <p style={styles.copyrightText}>
        {"dezvoltat de "}
        <Link href="https://webappdynamicx.ro/" style={styles.copyrightLink}>
          Web App Dynamicx
        </Link>{" "}
        {"."}
      </p>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function SettingsContPage() {
  const { isGuestUser, setAsGuestUser, setUserData, setCurrentUser } = useAuth();
  const { t } = useTranslation("common");
  const router = useRouter();

  const handleSubmitGuest = (event) => {
    if (event) event.preventDefault();
  };

  return (
    <>
      <Head>
        <title>
          {t("settingsContPageTitle")} | Cristina Zurba
        </title>
        <meta name="description" content={t("settingsContMetaDescription")} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={styles.mainWrapper}>
        <section>
          <Header isOnlySettngs={true} />
        </section>

        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-[5.5rem] sm:pb-32 sm:pt-24">
          <div style={styles.backWrap}>
            <Link href="/settings" style={styles.backLink}>
              {t("settingsFacturareBackToSettings")}
            </Link>
          </div>

          {isGuestUser ? (
            <div style={styles.guestContainer}>
              <div style={styles.logoContainer}>
                <Image src="/LogoPngTransparent.png" width={140} height={140} alt="Cristina Zurba Logo" />
              </div>
              <h1 style={styles.guestTitle}>{t("createAccountCTA")}</h1>
              <p style={styles.guestMessage}>{t("createAccountCTAMessage")}</p>
              <form onSubmit={handleSubmitGuest} style={styles.guestForm}>
                <button
                  onClick={() => {
                    handleLogout().then(() => {
                      setCurrentUser(null);
                      setUserData(null);
                      setAsGuestUser(false);
                      router.push("/login");
                    });
                  }}
                  type="submit"
                  style={styles.registerButton}
                >
                  {t("register")}
                </button>
                <div style={styles.copyrightSection}>
                  <Copyright />
                </div>
              </form>
            </div>
          ) : (
            <>
              <h1 className="mb-6 text-2xl font-semibold text-slate-900 sm:text-3xl">
                {t("settingsContPageTitle")}
              </h1>
              <AccountProfileForm
                footerSlot={
                  <div style={styles.copyrightSection}>
                    <Copyright />
                  </div>
                }
              />
            </>
          )}
        </main>
      </div>
    </>
  );
}

const styles = {
  mainWrapper: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    width: "100%",
    position: "relative",
  },
  backWrap: {
    marginBottom: "1.25rem",
  },
  backLink: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#667eea",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0",
    textDecoration: "underline",
  },
  guestContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-around",
    minHeight: "45vh",
    width: "100%",
    paddingTop: "1rem",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  guestTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: "1rem",
  },
  guestMessage: {
    fontSize: "1rem",
    color: "#666",
    textAlign: "center",
    marginBottom: "2rem",
  },
  guestForm: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  registerButton: {
    width: "100%",
    padding: "15px 24px",
    marginBottom: "2rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    color: "white",
    borderRadius: "25px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  copyrightSection: {
    marginTop: "2rem",
  },
  copyrightContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  copyrightText: {
    fontSize: "12px",
    color: "#666",
    margin: "0",
    textAlign: "center",
  },
  copyrightLink: {
    color: "#667eea",
    textDecoration: "none",
  },
};
