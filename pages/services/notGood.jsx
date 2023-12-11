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
import Service from "~/components/Services/Service";
import Sidebar from "~/components/Services/Sidebar";
import Footer from "~/components/Footer";
import { CircularProgress, Divider, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import { useParams } from "next/navigation";

import { useDatabase } from "../../context/DatabaseContext";
import Serv from "../../components/Services/Serv";
import { getAllServicesIds } from "../../utils/getFirebaseIds";
import { handleGetServices } from "../../utils/realtimeUtils";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { customStyles, wappPhone } from "../../data/data";

// export async function getStaticProps({ params }) {
//   // Obține datele din baza de date aici
//   const serv = await handleGetServices();

//   const filtered = serv.servicesArray.filter(
//     (service) => service.id == params.slug
//   );

//   let service = filtered;
//   return {
//     props: {
//       service,
//       services: serv,
//     },
//     revalidate: 2,
//   };
// }

export async function getServerSideProps({ params }) {
  // Obține datele din baza de date aici
  const serv = await handleGetServices();

  const filtered = serv.servicesArray.filter(
    (service) => service.id.toString() === params.slug // pentru cpanel - incearca cu un slug hardcoded (ex: 1), incearca sa faci parseInt(params.slug)
  );

  // Dacă nu găsește serviciul, returnează `notFound: true` pentru a afișa o pagină de 404
  if (!filtered.length) {
    return { notFound: true };
  }

  let service = filtered[0]; // Preia primul serviciu filtrat

  return {
    props: {
      service,
      services: serv,
    },
  };
}




function ServiceDetail(props) {
  const { classes } = useSpacing();
  const { classes: titleClasses } = useStyles();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

const router = useRouter()

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mattealeconsulting.com';

const currentUrl = `${baseUrl}${router.asPath || ''}`;

  return (
    <Fragment>
        <Head>
        <title>{props.service.title}</title>
        <meta
          name="description"
          content={props.service.metaDescription}
        />
        <meta name="og:title" content={props.service.title} />
        <meta
          name="og:description"
          content={props.service.metaDescription}
        />
        <meta name="keywords" content={props.service.metaKeys} />
        <meta property="og:url" content={currentUrl} />
      </Head>
      <CssBaseline />
      <style>{customStyles}</style> {/* Incluziunea stilurilor CSS */}
      <section id="home" />
        <Header home />
      <div className={classes.mainWrap}>

        <>
          <div className={classes.wraperSection} style={{paddingTop: isMobile && 100}}>
            <Box pt={5}>
              <Container>
                <Grid container spacing={4}>
                  <Grid item md={8} xs={12} style={{ paddingTop: 0 }}>
                    <Serv filteredServices={props.service} />
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


// export async function getStaticPaths() {
//   const allNewsIds = await getAllServicesIds(); // Fetch all available news IDs from Firebase

//   const paths = allNewsIds.map((id) => ({
//     params: { slug: id.toString() },
//   }));

//   const fallback = false;

//   return {
//     paths,
//     fallback,
//   };
// }

export default ServiceDetail;
