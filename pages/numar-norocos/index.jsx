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

// 🎨 NEW: Ultra-robust helper function to format description with line breaks
const formatDescription = (text) => {
  if (!text) return '';
  
  let result = text;
  
  // AGGRESSIVE MULTI-LAYERED APPROACH
  
  // 1. Handle known Romanian categories (most common case)
  const romanianCategories = [
    'Psihologic:', 'Energetic:', 'Dragoste:', 'Bani:', 'Practic:', 'Viitor:', 
    'Sănătate:', 'Carieră:', 'Spiritual:', 'Relații:', 'Muncă:'
  ];
  romanianCategories.forEach(category => {
    // Match: ". Category" or ".  Category" (multiple spaces)
    const pattern = new RegExp(`\\.\\s+${category.replace(':', '\\:')}`, 'g');
    result = result.replace(pattern, `.\n\n${category}`);
  });
  
  // 2. Generic pattern: ". [Capital][lowercase]*:"
  result = result.replace(/\.\s+([A-ZĂÎÂȘȚÁÉÍÓÚÜŐŰČĐŠŽŁĆŃĄ][a-zA-ZăîâșțáéíóúüőűčđšžłćńąćęłńóśźżĂÎÂȘȚ]*\s*:)/g, '.\n\n$1');
  
  // 3. Ultra-simple fallback: any ". [Word]:" pattern
  result = result.replace(/\.\s+([A-Z][a-z]+:)/g, '.\n\n$1');
  
  // 4. Handle edge cases with multiple spaces
  result = result.replace(/\.\s{2,}([A-Z][a-z]*:)/g, '.\n\n$1');
  
  // 5. Final cleanup: ensure we don't have triple line breaks
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result;
};

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
  const detectedLng = languageDetector.detect();
  const { classes, cx } = useSpacing();
  const { numereNorocoase } = useApiData();
  const [zilnicNumereNorocoase, setZilnicNumereNorocoase] = React.useState({});

  const [flipAllCards, setFlipAllCards] = React.useState(false);

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://cristinazurba.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const maxLines = 4; // Numărul maxim de rânduri dorit
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const cardTextStyles = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.4em", // Înălțimea unei linii
    maxHeight: `${maxLines * 1.4}em`, // Înălțime maximă calculată în funcție de numărul de rânduri
  };

  React.useEffect(() => {
    if (numereNorocoase.arr && numereNorocoase.arr.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * numereNorocoase.arr.length
      );
      setZilnicNumereNorocoase(numereNorocoase.arr[randomIndex]);
    }
  }, [numereNorocoase.arr]);

  const getRandomDocumentFirestore = async () => {
    // Presupunem că deja ai definit `collection` și `db`
    const coll = collection(db, "NumereNorocoase");
    const snapshot = await getCountFromServer(coll);
    const count = snapshot.data().count;
    console.log("count: ", count);

    const randomIndex = Math.floor(Math.random() * count) + 1;

    console.log(randomIndex);
    const obj = await handleQueryRandom("NumereNorocoase", randomIndex);
    setZilnicNumereNorocoase(obj);
  };

  // const uploadToFirestore = async (data) => {
  //   await handleUploadFirestore(data, "NumereNorocoase");
  // };

  React.useEffect(() => {
    // for (let i = 0; i < numereNorocoase.arr.length; i++) {
    //   uploadToFirestore(numereNorocoase.arr[i]);
    // }

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
        <title>{t("luckyNumberTitle")}</title>
        <meta
          name="description"
          content={t("luckyNumberDescription")}
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={t("luckyNumberTitle")} />
        <meta
          property="og:description"
          content={t("luckyNumberDescription")}
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
                <span style={{ fontSize: "18px" }}>🍀</span>
                {t("yourLuckyNumber")}
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
                {t("discoverDailyEnergy")}
              </h1>
              
              <p style={{
                fontSize: "1.2rem",
                color: "#64748b",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.6"
              }}>
                {t("numbersEnergyDescription")}
              </p>
            </div>

            <AdPlacementShell placementId="reading" />

            {/* Lucky Number Card */}
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: isMobile ? "40px 20px" : "60px 40px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(102, 126, 234, 0.1)",
              position: "relative",
              overflow: "hidden",
              maxWidth: "600px",
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
                {/* Number Display */}
                <div style={{
                  width: isMobile ? "140px" : "180px",
                  height: isMobile ? "140px" : "180px",
                  margin: "0 auto 30px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 15px 35px rgba(102, 126, 234, 0.4)",
                  position: "relative"
                }}>
                  {/* Glow Effect */}
                  <div style={{
                    position: "absolute",
                    top: "-10px",
                    left: "-10px",
                    right: "-10px",
                    bottom: "-10px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "50%",
                    opacity: "0.3",
                    filter: "blur(20px)",
                    zIndex: -1
                  }} />
                  
                  <span style={{
                    fontSize: isMobile ? "4rem" : "5rem",
                    fontWeight: "900",
                    color: "white",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                  }}>
                    {zilnicNumereNorocoase.number}
                  </span>
                </div>

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
                  <span>✨</span>
                </div>

                {/* Description */}
                {zilnicNumereNorocoase.info && (
                  <div style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    padding: "30px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    position: "relative"
                  }}>
                    <div style={{
                      position: "absolute",
                      top: "15px",
                      left: "20px",
                      fontSize: "40px",
                      color: "#667eea",
                      opacity: "0.3",
                      fontFamily: "Georgia, serif"
                    }}>
                      "
                    </div>
                    
                    <p style={{
                      fontSize: "1.1rem",
                      lineHeight: "1.7",
                      color: "#374151",
                      margin: "0",
                      textAlign: "justify",
                      fontStyle: "italic",
                      paddingLeft: "20px",
                      whiteSpace: "pre-line" // 🎨 NEW: Enable line breaks in text
                    }}>
                      {formatDescription(detectedLng === "hi"
                        ? zilnicNumereNorocoase.info.hu.descriere
                        : detectedLng === "id"
                          ? zilnicNumereNorocoase.info.ru.descriere
                          : zilnicNumereNorocoase.info[detectedLng].descriere)}
                    </p>
                  </div>
                )}


              </div>
            </div>

            {/* Bottom Info */}
            <div style={{
              textAlign: "center",
              marginTop: "60px",
              color: "#64748b",
              fontSize: "0.9rem"
            }}>
              <p>Numerele norocoase sunt ghiduri energetice pentru ziua ta. Folosește-le cu încredere! ✨</p>
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
