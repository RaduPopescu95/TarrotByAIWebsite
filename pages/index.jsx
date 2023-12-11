import React, { useEffect } from "react";

import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import { useSpacing } from "~/theme/common";
import Header from "../components/Header";
import BannerSlider from "../components/BannerSlider";
import Feature from "../components/Feature";

import NewsBanner from "../components/NewsBanner";
import Footer from "../components/Footer";
import TrustedBanner from "../components/TrustetBanner/TrustedBanner";
import { handleGetArticles } from "../utils/realtimeUtils";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { wappPhone } from "../data/data";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// Example for dynamic import with no SSR
const ContactBanner = dynamic(() => import("../components/ContactBanner"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

// export async function getStaticProps() {
//   const articles = await handleGetArticles();
//   return {
//     props: {
//       articles,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

export async function getServerSideProps({ locale }) {
  const articles = await handleGetArticles();
  return {
    props: {
      articles,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function Landing(props) {
  const { classes, cx } = useSpacing();
  const { articles } = props;

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => {
    router.push("/dashboard");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress />
    </div>
  );

  return (
    <React.Fragment>
      <Head>
        <title>Matteale Consulting</title>
        <meta
          name="description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Matteale Consulting" />
        <meta
          property="og:description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta
          property="og:image"
          content="https://mattealeconsulting.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
        <link
          rel="canonical"
          href="https://mattealeconsulting.com/"
          key="canonical"
        />
      </Head>
      <CssBaseline />
      <Header home />
      <div className={classes.mainWrap}>
        <main className={classes.containerWrap} style={{ marginTop: 0 }}>
          <section id="home">
            <BannerSlider />
          </section>
          <section
            className={classes.wraperTrustedBanner}
            id="feature"
            style={{
              backgroundColor: "#252525",
              paddingBottom: isDesktop ? 75 : 150,
              height: !isDesktop && 450,
            }}
          >
            <TrustedBanner />
          </section>
          <section
            id="feature"
            className={classes.wraperSection}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feature />
          </section>
          <section
            id="NewsBanner"
            className={classes.wraperSection}
            style={{ backgroundColor: "#252525" }}
          >
            <NewsBanner articles={articles} />
          </section>
          <section className={classes.wraperTrustedBanner}>
            <ContactBanner dark />
          </section>
        </main>
      </div>
      <Footer />

      <FloatingWhatsApp
        phoneNumber={wappPhone}
        accountName="Matteale Consulting"
        avatar="/logoWapp.svg"
      />
    </React.Fragment>
  );
}

export default Landing;
