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
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

// ... rest of your code

export function NumarNorocos() {
  const { currentUser, isGuestUser } = useAuth();
  const { t } = useTranslation("common", "services");
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
        <title>Lucky Color | Cristina Zurba</title>
        <meta
          name="description"
          content="Discover your lucky color with Cristina Zurba's unique insights. Learn how specific colors can influence your fortune and well-being. This guidance is perfect for anyone looking to enhance their luck and personal energy through the power of color."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Lucky Color | Cristina Zurba" />
        <meta
          property="og:description"
          content="Discover your lucky color with Cristina Zurba's unique insights. Learn how specific colors can influence your fortune and well-being. This guidance is perfect for anyone looking to enhance their luck and personal energy through the power of color."
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="google-adsense-account"
          content="ca-pub-9577714849380446"
        ></meta>
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
            style={{ paddingTop: isMobile ? "15%" : "5%", height: "100%" }}
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
                  {zilnicCuloriNorocoase.image &&
                    (isMobile ? (
                      <img
                        src={zilnicCuloriNorocoase.image.finalUri}
                        width={280}
                        height={280}
                        alt="Picture of the author"
                        style={{ marginTop: 10 }}
                      />
                    ) : (
                      <img
                        src={zilnicCuloriNorocoase.image.finalUri}
                        width={400}
                        height={400}
                        alt="Picture of the author"
                        style={{ marginTop: 10 }}
                      />
                    ))}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",

                      height: "auto",
                      marginTop: 20,
                    }}
                  >
                    <h1>{t("luckyColorOfTheDay")}</h1>

                    {zilnicCuloriNorocoase.info && (
                      <h2>
                        {detectedLng === "hi"
                          ? zilnicCuloriNorocoase.info.hu.nume
                          : detectedLng === "id"
                            ? zilnicCuloriNorocoase.info.ru.nume
                            : zilnicCuloriNorocoase.info[detectedLng].nume}
                      </h2>
                    )}
                    {zilnicCuloriNorocoase.info && (
                      <p style={{ textAlign: "justify", fontSize: 18 }}>
                        {detectedLng === "hi"
                          ? zilnicCuloriNorocoase.info.hu.descriere
                          : detectedLng === "id"
                            ? zilnicCuloriNorocoase.info.ru.descriere
                            : zilnicCuloriNorocoase.info[detectedLng].descriere}
                      </p>
                    )}
                  </div>
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
