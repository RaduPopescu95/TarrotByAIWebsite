import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import Header from "../components/Header";
// import Footer from "../components/Footer";

import { useSpacing } from "../theme/common";
import { useRouter } from "next/router";
import Head from "next/head";

import Image from "next/image";

import Link from "next/link";
// import { toUrlSlug } from "../utils/commonUtils";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, menuOptions } from "../data/servicesData";
import { colors } from "../utils/colors";
import { useAuth } from "../context/AuthContext";
// export async function getStaticProps() {
//   const services = await handleGetServices();
//   return {
//     props: {
//       services,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

// export async function getServerSideProps({ locale }) {
//   const services = await handleGetServices();
//   return {
//     props: {
//       services,
//       ...(await serverSideTranslations(locale, ["common", "services"])),
//     },
//   };
// }

// ... rest of your imports

const MediaCard = ({ item }) => {
  const { t } = useTranslation("common", "services");
  const route = useRouter();
  const maxLines = 4; // Numărul maxim de rânduri dorit

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
    <Card
      elevation={0}
      sx={{
        width: 345, // Use a fixed width instead of maxWidth
        borderRadius: 1,
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ height: "200px", position: "relative", width: "100%" }}>
        <img
          src={item.image.finalUri}
          alt={item.title}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
      <CardContent
        sx={{
          height: "170px", // Fixed height of the content area
          padding: "24px",
          overflow: "hidden", // Ensures text doesn't overflow
        }}
      >
        <Typography gutterBottom variant="h5" component="div" color="white">
          {item.name}
        </Typography>
        <Typography
          gutterBottom
          color="white"
          variant="body2"
          style={{
            ...cardTextStyles, // your existing styles
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.metaDescription}
        </Typography>
      </CardContent>

      <CardActions>
        <Link
          href={{
            pathname: "/services/[slug]",
            query: { slug: `${item.id}-${toUrlSlug(item.name)}` },
          }}
          as={`/services/${item.id}-${toUrlSlug(item.name)}`}
          passHref={false}
        >
          <Button
            sx={{
              fontSize: "15px",
              fontWeight: "700",
              backgroundColor: "transparent",
              color: "white",
              width: "100%",
              textTransform: "none",
              border: "1px solid #d3a03e",
              transition: "background-color 0.3s",
              "&:hover": {
                backgroundColor: "rgba(211, 160, 62, 0.1)",
                border: "1px solid #d3a03e",
              },
              marginTop: 2,
            }}
          >
            {t("LearnMore")}
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};

// ... rest of your code

const MediaCardConstantService = ({ item }) => {
  const { t: tCommon } = useTranslation("common");
  const { t: tServices } = useTranslation("services");
  const route = useRouter();
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
    <div
      style={{
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        minHeight: "255px", // Ajustează această valoare după necesitate
        minWidth: "300px", // Ajustează această valoare după necesitate
      }}
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
          fontSize: 20,
        }}
      >
        {item.text}
      </span>
    </div>
  );
};

export function Landing({ services }) {
  const { currentUser, isGuestUser } = useAuth();
  const { t } = useTranslation("common", "services");
  const { classes, cx } = useSpacing();

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
    if (currentUser) {
      router.push("login");
    }
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
        }}
      >
        <section>
          <Header />
        </section>

        <section>
          <div style={{ paddingTop: "9%" }} className={classes.wraperSection}>
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
                    xs={12}
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
