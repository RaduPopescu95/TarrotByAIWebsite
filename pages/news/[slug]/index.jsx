import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { CircularProgress } from "@mui/material";
import { useSpacing } from "../../../theme/common";
import Header from "../../../components/Header";
import Article from "../../../components/Blog/Article";
import Sidebar from "../../../components/Blog/Sidebar";

import { useRouter } from "next/router";
import { useDatabase } from "../../../context/DatabaseContext";
import languageDetector from "../../../lib/languageDetector";
import { colors } from "../../../utils/colors";
import {
  handleGetFirestore,
  handleQueryFirestore,
} from "../../../utils/firestoreUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Footer from "../../../components/Footer/SiteMap";

export async function getServerSideProps({ locale }) {
  // Obținerea datelor articolelor din Firestore
  const articlesData = await handleGetFirestore("BlogArticole");
  let articles = {};
  if (articlesData.length > 0) {
    // Sortarea articolelor după data și ora lor
    const sortedArticles = articlesData.sort((a, b) => {
      // Combină data și ora într-un singur string și convertește-le în obiecte de tip Date
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);

      // Compară obiectele de tip Date
      return dateTimeB - dateTimeA;
    });

    // Selectarea celor mai noi două articole
    const latestArticles = sortedArticles.slice(0, 2);

    // Selectarea celor mai noi cinci articole
    const latestFiveArticles = sortedArticles.slice(0, 5);

    // Selectarea celui mai nou articol
    const lastArticle = sortedArticles[0]; // Primul articol din lista sortată este cel mai recent

    // Returnarea datelor către componenta Next.js
    articles = {
      articlesData,
      latestArticles,
      lastArticle,
      latestFiveArticles,
    };
  } else {
    articles = {
      articlesData: [],
      latestArticles: [],
      lastArticle: [],
      latestFiveArticles: [],
    };
  }
  return {
    props: {
      articles,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function BlogDetail(props) {
  const { onToggleDark, onToggleDir } = props;
  const { classes } = useSpacing();
  // const { articles } = useDatabase(); // Assuming this is a context hook for fetching articles
  const router = useRouter();
  const [filteredArticle, setFilteredArticle] = useState(null);
  const detectedLng = languageDetector.detect();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const [articlesData, setArticlesData] = useState(null); // Starea pentru a stoca datele articolului
  const [loading, setLoading] = useState(false); // Starea pentru a stoca datele articolului
  const { articles } = props;
  useEffect(() => {
    console.log("test....");
    console.log(detectedLng);

    const slug = router.query.slug;
    const id = slug.split("-")[0]; // Extract the ID part
    const filtered = articles.articlesData.find(
      (article) => article.id.toString() === id
    );
    setFilteredArticle(filtered); // Set the found article
  }, [router.isReady, router.query.slug, articles.articlesData]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Fragment>
      <CssBaseline />
    
      <Head>
      <title>{filteredArticle?.info?.ro?.nume}</title>
      <meta name="description" content={filteredArticle?.info?.ro?.descriere} />
      <meta property="og:title" content={filteredArticle?.info?.ro?.nume} />
      <meta property="og:description" content={filteredArticle?.info?.ro?.descriere} />
      <meta property="og:image" content={filteredArticle?.image?.finalUri} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="article" />
      <meta name="keywords" content={filteredArticle?.metaKeys} />
    </Head>
    

      <Header
        onToggleDark={onToggleDark}
        onToggleDir={onToggleDir}
        home
        isSlug={true}
      />
      <div
        style={{
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin4}, ${colors.gradientLogin4}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
        }}
      >
        <div className={classes.mainWrap}>
          <section id="home" />
          <div className={classes.wraperSection} style={{ height: "100%" }}>
            <Box pt={5}>
              <Container>
                <Grid container spacing={4}>
                  <Grid item md={8} xs={12}>
                    <Article filteredArticles={filteredArticle} />
                  </Grid>
                  <Grid item md={4} xs={12}>
                    <Sidebar lastFiveArticles={articles.articlesData} />
                  </Grid>
                </Grid>
              </Container>
            </Box>
          </div>
        </div>
      </div>
      <Footer />
    </Fragment>
  );
}

export default BlogDetail;
