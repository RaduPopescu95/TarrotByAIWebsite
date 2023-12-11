import React, { Fragment } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

import { useSpacing } from "~/theme/common";
import Header from "~/components/Header";

import Banner from "~/components/About/Banner";

import AboutVideo from "~/components/About/Video";
import AboutProgress from "~/components/About/Progress";

import CallAction from "~/components/CallAction";

import Footer from "~/components/Footer";

import Mision from "../../components/About/Mision";
import Expertise from "../../components/About/Expertise/Expertise";
import Image from "next/image";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import { wappPhone } from "../../data/data";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

const bgColorBlack = { backgroundColor: "black" };
const bgColorGrey = { backgroundColor: "#252525" };

function About(props) {
  const { t } = useTranslation("common");
  const { classes, cx } = useSpacing();

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const textAligned = isDesktop ? "justify" : "start";
  return (
    <Fragment>
      {/* <SEOHead /> */}
      <CssBaseline />

      <div className={classes.mainWrap} style={bgColorBlack}>
        <Head>
          <title>About | Matteale Consulting</title>
          <meta
            name="description"
            content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
          />
          <meta property="og:url" content={currentUrl} />
          <meta property="og:title" content="About | Matteale Consulting" />
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
        <section>
          <Header />
        </section>
        <div className={classes.imgContainer}>
          <img
            src="/about-background-1.jpeg"
            alt="About Matteale Consulting"
            width={2550}
            height={1435}
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              paddingTop: isDesktop && 70,
            }}
            className={classes.aboutImg}
          />
          <h1 className={classes.aboutText} style={{ top: "55%" }}>
            {t("AboutUs")}
          </h1>
        </div>

        <div style={bgColorBlack} className={classes.wraperSection}>
          <Banner textAligned={textAligned} />
        </div>

        <div style={bgColorGrey} className={classes.wraperSection}>
          <AboutVideo textAligned={textAligned} />
        </div>
        <div style={bgColorBlack} className={classes.wraperSection}>
          <Expertise textAligned={textAligned} />
        </div>
        <div style={bgColorGrey} className={classes.wraperSection}>
          <Mision textAligned={textAligned} />
        </div>
        <div style={bgColorBlack} className={classes.wraperSection}>
          <Container>
            <Grid container spacing={2}>
              <Grid item sm={6} style={{ padding: 0 }}>
                <Box px={{ sm: 5 }}>
                  <img
                    src="/values.jpg"
                    style={{
                      width: "100%",
                      height: "auto",
                      minWidth: "60%",
                      borderRadius: 2,
                    }}
                    width={768}
                    height={476}
                    alt="Matteale Consulting"
                  />
                </Box>
              </Grid>
              <Grid item md={6} style={{ padding: 0 }}>
                <Box px={{ sm: 5 }}>
                  <AboutProgress textAligned={textAligned} />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </div>
        <div
          style={{ ...bgColorBlack, paddingTop: 0 }}
          className={classes.wraperSection}
        >
          <CallAction />
        </div>
        <Footer />
      </div>

      <FloatingWhatsApp
        phoneNumber={wappPhone}
        accountName="Matteale Consulting"
        avatar="/logoWapp.svg"
      />
    </Fragment>
  );
}

export default About;
