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
  const { t } = useTranslation("common", "services");
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
        <title>Motivational Quote | Cristina Zurba</title>
        <meta
          name="description"
          content="Discover Cristina Zurba's collection of motivational quotes, designed to inspire and uplift. Each quote is carefully chosen to boost motivation and provide encouragement. Perfect for those seeking a dose of positivity and inspiration in their daily lives."
        />
        <meta property="og:url" content={currentUrl} />
        <meta
          property="og:title"
          content="Motivational Quote | Cristina Zurba"
        />
        <meta
          property="og:description"
          content="Discover Cristina Zurba's collection of motivational quotes, designed to inspire and uplift. Each quote is carefully chosen to boost motivation and provide encouragement. Perfect for those seeking a dose of positivity and inspiration in their daily lives."
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <div
        style={{
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
        }}
      >
        <section>
          <Header />
        </section>

        <section>
          <div
            style={{
              paddingTop: "7%",
              height: "100vh",
              marginBottom: "60px",
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
                  }}
                >
                  <Image
                    src="/lucky-deco.png"
                    width={278}
                    height={65}
                    alt="Picture of the author"
                    style={{ marginTop: 10 }}
                  />
                  <h1>{t("motivationalQuoteOfTheDay")}</h1>
                  {zilnicCitateMotivationale.info && (
                    <p style={{ textAlign: "justify", fontSize: 18 }}>
                      {detectedLng === "hi"
                        ? zilnicCitateMotivationale.info.hu.descriere
                        : detectedLng === "id"
                          ? zilnicCitateMotivationale.info.ru.descriere
                          : zilnicCitateMotivationale.info[detectedLng]
                              .descriere}
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

export default NumarNorocos;
