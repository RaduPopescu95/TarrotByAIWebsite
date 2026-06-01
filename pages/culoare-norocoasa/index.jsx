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
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, futureOptions } from "../../data/servicesData";
import { colors } from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import languageDetector from "../../lib/languageDetector";
import AdPlacementShell from "../../components/Ads/AdPlacementShell";
import {
  handleQueryRandom,
  handleUploadFirestore,
} from "../../utils/firestoreUtils";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase";

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
  const { classes, cx } = useSpacing();
  const { culoriNorocoase } = useApiData();
  const [zilnicCuloriNorocoase, setZilnicCuloriNorocoase] = React.useState({});
  const detectedLng = languageDetector.detect();
  const [flipAllCards, setFlipAllCards] = React.useState(false);

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://cristinazurba.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const maxLines = 4; // Numărul maxim de rânduri dorit
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getRandomDocumentFirestore = async () => {
    // Presupunem că deja ai definit `collection` și `db`
    const coll = collection(db, "CuloriNorocoase");
    const snapshot = await getCountFromServer(coll);
    const count = snapshot.data().count;
    console.log("count: ", count);

    const randomIndex = Math.floor(Math.random() * count) + 1;

    console.log(randomIndex);
    const obj = await handleQueryRandom("CuloriNorocoase", randomIndex);
    setZilnicCuloriNorocoase(obj);
  };

  // const uploadToFirestore = async (data) => {
  //   handleUploadFirestore(data, "CuloriNorocoase");
  // };

  React.useEffect(() => {
    // for (let i = 0; i < culoriNorocoase.arr.length; i++) {
    //   uploadToFirestore(culoriNorocoase.arr[i]);
    // }

    getRandomDocumentFirestore();
  }, []);

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
        <title>{t("luckyColorTitle")}</title>
        <meta
          name="description"
          content={t("luckyColorDescription")}
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={t("luckyColorTitle")} />
        <meta
          property="og:description"
          content={t("luckyColorDescription")}
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
        <section style={{ padding: "100px 0" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}>
            {/* Hero Section */}
            <div style={{ textAlign: "center", marginBottom: "20px",  }}>
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
                <span style={{ fontSize: "18px" }}>🎨</span>
                {t("yourLuckyColor")}
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
                {t("discoverDailyColor")}
              </h1>
              
              <p style={{
                fontSize: "1.2rem",
                color: "#64748b",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.6"
              }}>
                {t("colorsEnergyDescription")}
              </p>
            </div>

            <AdPlacementShell placementId="banner1" />

            {/* Lucky Color Card */}
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: isMobile ? "40px 25px" : "60px 60px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
              border: "0.5px solid rgba(102, 126, 234, 0.1)",
              position: "relative",
              overflow: "hidden",
              maxWidth: isMobile ? "90%" : "800px",
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
                {/* Color Display */}
                {zilnicCuloriNorocoase.image && (
                  <div style={{
                    margin: "0 auto 30px",
                    position: "relative",
                    display: "inline-block"
                  }}>
                    <div style={{
                      width: isMobile ? "280px" : "350px",
                      height: isMobile ? "280px" : "350px",
                      borderRadius: "50%",
                      padding: isMobile ? "6px" : "8px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 15px 35px rgba(102, 126, 234, 0.4)"
                    }}>
                      <img
                        src={zilnicCuloriNorocoase.image.finalUri}
                        width={isMobile ? 268 : 334}
                        height={isMobile ? 268 : 334}
                        alt="Lucky Color"
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "5px solid white",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                    </div>
                    
                    {/* Glow Effect */}
                    <div style={{
                      position: "absolute",
                      top: "-15px",
                      left: "-15px",
                      right: "-15px",
                      bottom: "-15px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "50%",
                      opacity: "0.2",
                      filter: "blur(25px)",
                      zIndex: -1
                    }} />
                  </div>
                )}

                {/* Color Name */}
                {zilnicCuloriNorocoase.info && (
                  <h2 style={{
                    fontSize: isMobile ? "2.2rem" : "2.8rem",
                    fontWeight: "700",
                    color: "#1a202c",
                    margin: "0 0 20px 0",
                    textTransform: "capitalize"
                  }}>
                    {detectedLng === "hi"
                      ? zilnicCuloriNorocoase.info.hu.nume
                      : detectedLng === "id"
                        ? zilnicCuloriNorocoase.info.ru.nume
                        : zilnicCuloriNorocoase.info[detectedLng].nume}
                  </h2>
                )}

                {/* Decorative Elements */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  marginBottom: "30px",
                  fontSize: "24px"
                }}>
                  <span>🌈</span>
                  <span>✨</span>
                  <span>🎨</span>
                </div>

                {/* Description */}
                {zilnicCuloriNorocoase.info && (
                  <div style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    padding: isMobile ? "25px 20px" : "30px 25px",
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
                      fontSize: isMobile ? "1.3rem" : "1.4rem",
                      lineHeight: "1.7",
                      color: "#374151",
                      margin: "0",
                      textAlign: isMobile ? "left" : "justify",
                      fontStyle: "italic",
                      paddingLeft: isMobile ? "10px" : "15px",
                      whiteSpace: "pre-line" // 🎨 NEW: Enable line breaks in text
                    }}>
                      {formatDescription(detectedLng === "hi"
                        ? zilnicCuloriNorocoase.info.hu.descriere
                        : detectedLng === "id"
                          ? zilnicCuloriNorocoase.info.ru.descriere
                          : zilnicCuloriNorocoase.info[detectedLng].descriere)}
                    </p>
                  </div>
                )}


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
                              <p>{t("colorsInfluenceEnergy")}</p>
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
