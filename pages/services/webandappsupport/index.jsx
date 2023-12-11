import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { useSpacing } from "~/theme/common";
import useStyles from "~/components/Services/service-style";
import Header from "~/components/Header";

import Sidebar from "~/components/Services/Sidebar";
import Footer from "~/components/Footer";

import Serv from "../../../components/Services/Serv";

import { handleGetServices } from "../../../utils/realtimeUtils";
import { useRouter } from "next/router";
import {
  CloudSolutionsData,
  WebAppSupportData,
} from "../../../data/servicesData";
import { useMediaQuery, useTheme } from "@mui/material";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { wappPhone } from "../../../data/data";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export async function getServerSideProps({ locale }) {
  const services = await handleGetServices();
  return {
    props: {
      services,
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

function WebAndAppSupport(props) {
  const { classes } = useSpacing();
  const { classes: titleClasses } = useStyles();

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  // In your component
  const currentUrl = `${baseUrl}${router.asPath || ""}`;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Fragment>
      <Head>
        <title>Cloud Solutions | Cloud Migration | Cloud Security</title>
        <meta
          name="description"
          content="We offer top-notch cloud solutions to reach a higher level of efficiency for your enterprise: cloud strategy, migration, native apps, and security."
        />
        <meta property="og:url" content={currentUrl} />
        <meta
          property="og:title"
          content="Cloud Solutions | Cloud Migration | Cloud Security"
        />
        <meta
          property="og:description"
          content="We offer top-notch cloud solutions to reach a higher level of efficiency for your enterprise: cloud strategy, migration, native apps, and security."
        />
        <meta
          property="og:image"
          content="https://mattealeconsulting.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <CssBaseline />
      <Header home />
      <section id="home" />
      <div className={classes.mainWrap}>
        <>
          <div
            className={classes.wraperSection}
            style={{ paddingTop: isMobile && 100 }}
          >
            <Box pt={5}>
              <Container>
                <Grid container spacing={4}>
                  <Grid item md={8} xs={12} style={{ paddingTop: 0 }}>
                    <Serv filteredServices={WebAppSupportData} />
                  </Grid>
                  <Grid item md={4} xs={12} style={{ paddingTop: 0 }}>
                    <Sidebar services={props.services} />
                  </Grid>
                </Grid>
              </Container>
            </Box>
          </div>
        </>
      </div>
      <div id="footer">
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

export default WebAndAppSupport;
