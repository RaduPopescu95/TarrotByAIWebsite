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
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

// ... rest of your code

export function CitateMotivationale() {
  const { currentUser, isGuestUser } = useAuth();
  const { t } = useTranslation("common", "services");
  const { classes, cx } = useSpacing();
  const { oreNorocoase } = useApiData();
  const detectedLng = languageDetector.detect();
  const [flipAllCards, setFlipAllCards] = React.useState(false);

  const [zilnicOreNorocoase, setZilnicOreNorocoase] = React.useState({});

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

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
    if (oreNorocoase.arr && oreNorocoase.arr.length > 0) {
      const randomIndex = Math.floor(Math.random() * oreNorocoase.arr.length);
      setZilnicOreNorocoase(oreNorocoase.arr[randomIndex]);
    }
  }, [oreNorocoase.arr]);

  React.useEffect(() => {
    if (!currentUser && !isGuestUser) {
      router.push("login");
    }
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
        <title>Services | Matteale Consulting</title>
        <meta
          name="description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Services | Matteale Consulting" />
        <meta
          property="og:description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta
          property="og:image"
          content="https://mattealeconsulting.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <div
        style={{
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
          height: isMobile ? "100vh" : "100%",
        }}
      >
        <section>
          <Header />
        </section>

        <section>
          <div
            style={{
              paddingTop: isMobile ? "15%" : "7%",
              height: isMobile ? "100%" : "100vh",
            }}
            className={classes.wraperSection}
          >
            <Grid
              container
              rowSpacing={isMobile ? 5 : 5}
              columnSpacing={0}
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                top: 30,
                position: "relative",
                paddingLeft: isMobile ? 5 : 10,
                paddingRight: isMobile ? 5 : 10,
              }}
            >
              <Grid item xs={12} sm={12} md={12}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    flexDirection: "column",
                    marginBottom: "60px",
                  }}
                >
                  <div
                    style={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "50%",
                      backgroundColor: colors.primary3,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <h2 style={{ color: "white", fontSize: 50 }}>
                      {zilnicOreNorocoase.ora}
                    </h2>
                  </div>
                  <Image
                    src="/lucky-deco.png"
                    width={278}
                    height={65}
                    alt="Picture of the author"
                    style={{ marginTop: 10 }}
                  />
                  {zilnicOreNorocoase.info && (
                    <p style={{ textAlign: "justify", fontSize: 18 }}>
                      {detectedLng === "hi"
                        ? zilnicOreNorocoase.info.hu.descriere
                        : detectedLng === "id"
                          ? zilnicOreNorocoase.info.ru.descriere
                          : zilnicOreNorocoase.info[detectedLng].descriere}
                    </p>
                  )}
                </div>
              </Grid>
            </Grid>
          </div>
        </section>
        {/* <section>
          <Footer />
        </section> */}
      </div>
    </>
  );
}

export default CitateMotivationale;
