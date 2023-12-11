import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import { useSpacing } from "~/theme/common";
import Header from "~/components/Header";
import Article from "~/components/Blog/Article";
import Sidebar from "~/components/Blog/Sidebar";
import Footer from "~/components/Footer";

import {createTheme, useMediaQuery, useTheme } from "@mui/material";

import { handleGetArticles } from "../../utils/realtimeUtils";
import { getAllNewsIds } from "../../utils/getFirebaseIds";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { useRouter } from "next/router";
import { wappPhone } from "../../data/data";

// export async function getStaticProps({ params }) {
//   // Obține datele din baza de date aici
//   const arts = await handleGetArticles();

//   const filtered = arts.articlesArray.filter(
//     (article) => article.id == params.slug
//   );
//   let article = filtered;
//   return {
//     props: {
//       article,
//       articles: arts,
//     },
//     revalidate: 2,
//   };
// }

export async function getServerSideProps({ params }) {
  // Fetch the data from your database here
  const arts = await handleGetArticles();

  // Filter the articles to find the one with the matching id
  const filtered = arts.articlesArray.filter(
    (article) => article.id.toString() === params.slug
  );

  // If no articles are found, return the notFound flag to show a 404 page
  if (filtered.length === 0) {
    return { notFound: true };
  }

  // Since filter returns an array and we want the first article
  let article = filtered[0];

  return {
    props: {
      article,
      articles: arts,
    },
    // There is no revalidate key needed for getServerSideProps as it runs on every request
  };
}



function BlogDetail(props) {
  const { classes } = useSpacing();
  const { article } = props;
  // Creează un useState pentru a gestiona array-ul filtrat

  const defaultTheme = createTheme();

  defaultTheme.typography.p = {
    fontSize: "60px",
    color: "white",
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const router = useRouter()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mattealeconsulting.com';
  
  const currentUrl = `${baseUrl}${router.asPath || ''}`;

  return (
    <Fragment>
      <Head>
        <title>{article.title}</title>
        <meta
          name="description"
          content={article.metaDescription}
        />
        <meta name="og:title" content={article.title} />
        <meta
          name="og:description"
          content={article.metaDescription}
        />
        <meta name="keywords" content={article.metaKeys} />
        <meta property="og:url" content={currentUrl} />
      </Head>
      <CssBaseline />
      <section id="home" />

        <Header home />
      <div className={classes.mainWrap} style={{paddingTop: isMobile && 100}}>
        <div className={classes.wraperSection}>
          <Box pt={5}>
            <Container style={{}}>
              <Grid container spacing={4}>
                <Grid item md={8} xs={12} style={{ paddingTop: 0 }}>
                  <Article filteredArticles={article} />
                </Grid>
                <Grid item md={4} xs={12} style={{ paddingTop: 0 }}>
                  <Sidebar lastFiveArticles={props.articles.lastFiveArticles} />
                </Grid>
              </Grid>
            </Container>
          </Box>
        </div>
      </div>
        <div id="footerr">
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



export default BlogDetail;

// Use this below for Server Side Render/Translation (SSR)

// export async function getStaticPaths() {
//   const allNewsIds = await getAllNewsIds(); // Fetch all available news IDs from Firebase

//   const paths = allNewsIds.map((id) => ({
//     params: { slug: id.toString() },
//   }));

//   const fallback = false;

//   return {
//     paths,
//     fallback,
//   };
// }

