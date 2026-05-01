import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { handleGetUserInfoJobs } from "../../utils/handleFirebaseQuery";
import { hasPremiumAccess } from "../../lib/premiumAccess";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default function PremiumZonePage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { currentUser, userData, loading, setUserData, isGuestUser } = useAuth();

  React.useEffect(() => {
    if (router.query.checkout !== "success") return;
    let cancelled = false;
    (async () => {
      const profile = await handleGetUserInfoJobs();
      if (!cancelled && profile) {
        setUserData(profile);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.query.checkout, setUserData]);

  const access = hasPremiumAccess(userData);
  const activationPending =
    router.query.checkout === "success" && currentUser && !isGuestUser && !access;
  const showLocked = currentUser && !isGuestUser && !access && !activationPending;

  return (
    <>
      <Head>
        <title>{t("premiumZoneTitle")} | Cristina Zurba</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <section>
          <Header />
        </section>
        <main
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "2rem 1.5rem 4rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Image
              src="/LogoPngTransparent.png"
              width={100}
              height={100}
              alt="Cristina Zurba"
            />
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#666" }}>{t("coursesPurchasedLoading")}</p>
          ) : !currentUser || isGuestUser ? (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "1rem" }}>
                {t("premiumLockedTitle")}
              </h1>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>{t("premiumLoginPrompt")}</p>
              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderRadius: "25px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t("premiumLoginCta")}
              </Link>
            </div>
          ) : activationPending ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#666", lineHeight: 1.6 }}>{t("premiumCheckoutProcessing")}</p>
            </div>
          ) : showLocked ? (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "1.5rem", color: "#333", marginBottom: "1rem" }}>
                {t("premiumLockedTitle")}
              </h1>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                {t("premiumLockedDescription")}
              </p>
              <Link
                href="/abonament"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderRadius: "25px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {t("premiumLockedCta")}
              </Link>
            </div>
          ) : (
            <div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  color: "#333",
                  marginBottom: "0.75rem",
                  textAlign: "center",
                }}
              >
                {t("premiumZoneHeading")}
              </h1>
              <p style={{ color: "#666", textAlign: "center", marginBottom: "2rem" }}>
                {t("premiumZoneDescription")}
              </p>
              <div
                style={{
                  border: "2px solid #e9ecef",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  background: "#fafafa",
                }}
              >
                <p style={{ margin: "0 0 1rem", color: "#555", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {t("premiumVideoLibraryIntro")}
                </p>
                <Link
                  href="/videouri"
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    background: "#1e293b",
                    color: "white",
                    borderRadius: "999px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {t("videoLibraryNav")}
                </Link>
              </div>
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <Link
                  href="/courses"
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    borderRadius: "25px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  {t("premiumBrowseCoursesCta")}
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
