import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import Header from "../../components/Header";
// import Footer from "../components/Footer";

import { useSpacing } from "../../theme/common";
import { useRouter } from "next/router";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

import Image from "next/image";

import Link from "next/link";
// import { toUrlSlug } from "../utils/commonUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, futureOptions } from "../../data/servicesData";
import { colors } from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
import languageDetector from "../../lib/languageDetector";
import {
  handleQueryRandom,
  handleUploadFirestore,
} from "../../utils/firestoreUtils";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase";
import AdPlacementShell from "../../components/Ads/AdPlacementShell";
// export async function getStaticProps() {
//   const services = await handleGetServices();
//   return {
//     props: {
//       services,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

// ... rest of your code

export function NumarNorocos() {
  const { currentUser, isGuestUser } = useAuth();
  const { t } = useTranslation("common");
  const { classes, cx } = useSpacing();
  const detectedLng = languageDetector.detect();
  const [flipAllCards, setFlipAllCards] = React.useState(false);

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://crinstinazurba.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const maxLines = 4; // Numărul maxim de rânduri dorit
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { citateMotivationale } = useApiData();

  const cardTextStyles = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.4em", // Înălțimea unei linii
    maxHeight: `${maxLines * 1.4}em`, // Înălțime maximă calculată în funcție de numărul de rânduri
  };

  const [zilnicCitateMotivationale, setZilnicCitateMotivationale] =
    React.useState({});

  // const uploadToFirestore = async (data) => {
  //   handleUploadFirestore(data, "CitateMotivationale");
  // };
  const getRandomDocumentFirestore = async () => {
    // Presupunem că deja ai definit `collection` și `db`
    const coll = collection(db, "CitateMotivationale");
    const snapshot = await getCountFromServer(coll);
    const count = snapshot.data().count;
    console.log("count: ", count);

    const randomIndex = Math.floor(Math.random() * count) + 1;

    console.log(randomIndex);
    const obj = await handleQueryRandom("CitateMotivationale", randomIndex);
    setZilnicCitateMotivationale(obj);
  };

  React.useEffect(() => {
    getRandomDocumentFirestore();
  }, []);

  // Access allowed without authentication

  React.useEffect(() => {
    // Setează o întârziere pentru a permite tuturor cardurilor să termine animația de intrare
    const delay = constantServices.length * 0.15 + 0.5; // Ajustează această valoare dacă este necesar
    const timer = setTimeout(() => {
      setFlipAllCards(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>{t("motivationalQuoteTitle")}</title>
        <meta
          name="description"
          content={t("motivationalQuoteDescription")}
        />
        <meta property="og:url" content={currentUrl} />
        <meta
          property="og:title"
          content={t("motivationalQuoteTitle")}
        />
        <meta
          property="og:description"
          content={t("motivationalQuoteDescription")}
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Modern Header */}
        <section>
          <Header />
        </section>

        {/* Modern Minimal Design */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
            {/* Hero Section */}
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "50px",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "24px",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
              }}>
                <span style={{ fontSize: "18px" }}>💫</span>
                {t("motivationalQuote")}
              </div>
              
              <h1 style={{
                fontSize: isMobile ? "2.5rem" : "3.5rem",
                fontWeight: "800",
                color: "#1a202c",
                margin: "0 0 16px 0",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                {t("inspirationForSoul")}
              </h1>
              
              <p style={{
                fontSize: "1.2rem",
                color: "#64748b",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.6"
              }}>
                {t("dailyOpportunityDescription")}
              </p>
            </div>

            <AdPlacementShell placementId="banner1" />

            {/* Quote Card */}
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: isMobile ? "40px 20px" : "60px 40px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(102, 126, 234, 0.1)",
              position: "relative",
              overflow: "hidden",
              maxWidth: "800px",
              margin: "0 auto"
            }}>
              {/* Background Pattern */}
              <div style={{
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background: "linear-gradient(45deg, rgba(102, 126, 234, 0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(102, 126, 234, 0.03) 25%, transparent 25%)",
                backgroundSize: "20px 20px",
                zIndex: 0
              }} />

              {/* Content */}
              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Quote Icon */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "50%",
                  marginBottom: "30px",
                  boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)"
                }}>
                  <span style={{
                    fontSize: "32px",
                    color: "white"
                  }}>💫</span>
                </div>

                {/* Quote Text */}
                {zilnicCitateMotivationale.info && (
                  <div style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    padding: "40px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    position: "relative",
                    marginBottom: "30px"
                  }}>
                    {/* Opening Quote */}
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      left: "20px",
                      fontSize: "60px",
                      color: "#667eea",
                      opacity: "0.3",
                      fontFamily: "Georgia, serif",
                      lineHeight: "1"
                    }}>
                      "
                    </div>

                    {/* Closing Quote */}
                    <div style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "20px",
                      fontSize: "60px",
                      color: "#667eea",
                      opacity: "0.3",
                      fontFamily: "Georgia, serif",
                      lineHeight: "1",
                      transform: "rotate(180deg)"
                    }}>
                      "
                    </div>
                    
                    <p style={{
                      fontSize: isMobile ? "1.3rem" : "1.5rem",
                      lineHeight: "1.6",
                      color: "#1a202c",
                      margin: "0",
                      fontStyle: "italic",
                      fontWeight: "500",
                      padding: "20px 40px"
                    }}>
                      {detectedLng === "hi"
                        ? zilnicCitateMotivationale.info.hu.descriere
                        : detectedLng === "id"
                          ? zilnicCitateMotivationale.info.ru.descriere
                          : zilnicCitateMotivationale.info[detectedLng]
                              .descriere}
                    </p>
                  </div>
                )}

                {/* Decorative Elements */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  marginBottom: "30px",
                  fontSize: "24px"
                }}>
                  <span>✨</span>
                  <span>🌟</span>
                  <span>💫</span>
                </div>


              </div>
            </div>

            <AdPlacementShell placementId="banner2" />

            {/* Bottom Info */}
            <div style={{
              textAlign: "center",
              marginTop: "60px",
              color: "#64748b",
              fontSize: "0.9rem"
            }}>
              <p>Cuvintele au puterea să transforme. Lasă-te inspirat și acționează! 💫</p>
            </div>
          </div>
        </section>
        {/* <section>
          <Footer />
        </section> */}
      </div>
    </>
  );
}

export default NumarNorocos;
