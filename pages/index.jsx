import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  Box,
  CircularProgress,
  Container,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Header from "../components/Header";
// import Footer from "../components/Footer";

import { useSpacing } from "../theme/common";
import { useRouter } from "next/router";
import Head from "next/head";

import Image from "next/image";

import Link from "next/link";
// import { toUrlSlug } from "../utils/commonUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, menuOptions } from "../data/servicesData";
import { colors } from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import { useApiData } from "../context/ApiContext";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
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

const MediaCardConstantService = ({ item }) => {
  const { t: tCommon } = useTranslation("common");
  const { classes, cx } = useSpacing();
  const route = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const maxLines = 4;
  const cardTextStyles = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.4em", // Înălțimea unei linii
    maxHeight: `${maxLines * 1.4}em`, // Înălțime maximă calculată în funcție de numărul de rânduri
  };

  return (
    <Box
      onClick={() => route.push(item.route)}
      sx={{
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",

        cursor: "pointer",
        borderRadius: "18px",
        transition: "all 0.3s ease", // Adaugă tranziție pentru efect neted
        "&:hover": {
          boxShadow: "0px 10px 10px rgba(0,0,0,0.2)", // Umbra la hover,
          backgroundColor: "transparent",
        },
      }}
      className={classes.MediaCardConstantServiceBox}
    >
      <img
        src={"/dash-frame.png"}
        alt={item.title}
        style={{
          objectFit: "cover",
          width: "100%",
          height: "100%", // Poți încerca să setezi la 100% pentru a umple containerul
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <span
        style={{
          position: "relative",
          color: "white",
          zIndex: 1,
          fontSize: isMobile ? 13 : 20,
          width: isMobile ? "50%" : "auto",
        }}
      >
        {item.text}
      </span>
    </Box>
  );
};

export function Landing({ services }) {
  const { currentUser, isGuestUser } = useAuth();
  const {
    oreNorocoase,
    numereNorocoase,
    culoriNorocoase,
    citateMotivationale,
    categoriiViitor,
    cartiViitor,
    categoriiPersonalizate,
    cartiPersonalizate,
    loading,
    varianteCarti,
    error,
    fetchData,
    zilnicCitateMotivationale,
  } = useApiData();
  const { t } = useTranslation("common", "services");
  const { classes, cx } = useSpacing();

  // const menuOptions = [
  //   { text: "asdadds", route: "/citire-personalizata" },
  //   { text: "asdadds", route: "/citire-viitor" },
  //   { text: "asdadds", route: "/numar-norocos" },
  //   { text: "asdadds", route: "/culoare-norocoasa" },
  //   { text: "asdadds", route: "/ora-norocoasa" },
  //   { text: "asdadds", route: "/citat-motivational" },
  // ];
  const menuOptions = [
    { text: t("personalReading"), route: "/citire-personalizata" },
    { text: t("futureReading"), route: "/citire-viitor" },
    { text: t("luckyNumber"), route: "/numar-norocos" },
    { text: t("luckyColor"), route: "/culoare-norocoasa" },
    { text: t("luckyHours"), route: "/ora-norocoasa" },
    { text: t("motivationalQuotes"), route: "/citat-motivational" },
  ];

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

  const handleAddToFirestore = async () => {
    const types = [
      { name: "OreNorocoase", arr: oreNorocoase },
      { name: "NumereNorocoase", arr: numereNorocoase },
      { name: "CuloriNorocoase", arr: culoriNorocoase },
      { name: "CitateMotivationale", arr: citateMotivationale },
      { name: "CategoriiViitor", arr: categoriiViitor },
      { name: "CartiViitor", arr: cartiViitor },
      { name: "CategoriiPersonalizate", arr: categoriiPersonalizate },
      { name: "CartiPersonalizate", arr: cartiPersonalizate },
    ];

    for (const type of types) {
      if (type.arr && type.arr.arr.length > 0) {
        console.log(`${type.name}.....xxx,,xxx...`, type.arr);

        const collectionName = type.name;
        // const ref = doc(collection(db, collectionName));

        // await setDoc(ref, type.arr);
      }
    }
  };

  // React.useEffect(() => {
  //   // handleAddToFirestore();

  //   console.log(`test.....xxx,,xxx......`, numereNorocoase);

  //   if (!currentUser && !isGuestUser) {
  //     router.push("login");
  //   }
  // }, []);

  // if ((!currentUser && !isGuestUser) || loading) {
  //   return (
  //     <div
  //       style={{
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         height: "100vh",
  //         width: "100%",
  //       }}
  //     >
  //       <CircularProgress color="secondary" sx={{ fontSize: "100px" }} />
  //     </div>
  //   );
  // }

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
        }}
      >
        <section>
          <Header />
        </section>

        <section>
          <div
            style={{ paddingTop: isMobile ? "25%" : "9%" }}
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
              }}
            >
              {menuOptions.map((item, index) => {
                return (
                  <Grid
                    key={index}
                    item
                    xs={6}
                    sm={4}
                    md={4}
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",

                      // height: 500,
                    }}
                  >
                    <MediaCardConstantService item={item} />
                  </Grid>
                );
              })}
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

export default Landing;
