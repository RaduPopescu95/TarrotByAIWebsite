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
import PremiumSubscriptionBillingCard from "../../components/settings/PremiumSubscriptionBillingCard";

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

export default function SettingsFacturarePage() {
  const { isGuestUser, setAsGuestUser, setUserData, setCurrentUser } = useAuth();
  const { t } = useTranslation("common");
  const router = useRouter();

  const [message, setMessage] = React.useState("");
  const [showSnackback, setShowSnackback] = React.useState(false);

  const handleSubmitGuest = (event) => {
    if (event) event.preventDefault();
  };

  return (
    <>
      <Head>
        <title>
          {t("settingsFacturarePageTitle")} | Cristina Zurba
        </title>
        <meta name="description" content={t("settingsFacturareMetaDescription")} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={styles.mainWrapper}>
        <section>
          <Header isOnlySettngs={true} />
        </section>

        <main className="mx-auto w-full max-w-3xl px-4 pb-14 pt-[5.5rem] sm:pt-24">
          <div style={styles.backButton}>
            <Link href="/settings" style={styles.backButtonElement}>
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
                      router.push("login");
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
              <div style={styles.logoContainer}>
                <Image src="/LogoPngTransparent.png" width={120} height={120} alt="Cristina Zurba Logo" />
              </div>
              <h1 className="mb-8 text-center text-2xl font-semibold text-slate-900 sm:text-left">
                {t("settingsFacturarePageTitle")}
              </h1>
              <PremiumSubscriptionBillingCard
                onNotify={({ message: msg }) => {
                  setMessage(msg);
                  setShowSnackback(true);
                }}
              />
              <div style={styles.copyrightSection}>
                <Copyright />
              </div>
            </>
          )}
        </main>

        {showSnackback ? (
          <div style={styles.snackbar}>
            <div style={styles.alert}>{message}</div>
          </div>
        ) : null}
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
  backButton: {
    marginBottom: "1.25rem",
  },
  backButtonElement: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#667eea",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0",
    borderRadius: "8px",
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
  snackbar: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
  },
  alert: {
    padding: "12px 24px",
    backgroundColor: "#e3f2fd",
    color: "#0277bd",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "14px",
  },
};
