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

function BlogDetail(props) {
  const { onToggleDark, onToggleDir } = props;
  const { classes } = useSpacing();
  const { articles } = useDatabase(); // Assuming this is a context hook for fetching articles
  const router = useRouter();
  const [filteredArticle, setFilteredArticle] = useState(null);
  const detectedLng = languageDetector.detect();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const [articlesData, setArticlesData] = useState(null); // Starea pentru a stoca datele articolului

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const data = await handleGetFirestore("BlogArticole");
  //     setArticlesData(data); // Presupunând că aceasta setează datele articolului în starea componentei
  //   };

  //   fetchData();
  // }, []); // Dependența goală indică faptul că acest efect se rulează o singură dată, la montarea componentei

  useEffect(() => {
    if (
      router.isReady &&
      articles.articlesData &&
      Array.isArray(articles.articlesData)
    ) {
      const slug = router.query.slug;
      const id = slug.split("-")[0];
      const filtered = articles.articlesData.find(
        (article) => article.id.toString() === id
      );
      if (filtered) {
        setFilteredArticle(filtered);
      } else {
        // Gestionează cazul când articolul nu este găsit, de exemplu:
        console.log("Articolul nu a fost găsit.");
      }

      setArticlesData(articles);
    }
  }, [router.isReady, router.query.slug]);
  return (
    <Fragment>
      <CssBaseline />
      {filteredArticle && (
        <Head>
          <title>{filteredArticle.title}</title>
          <meta name="description" content={filteredArticle.metaDescription} />
          <meta name="og:title" content={filteredArticle.title} />
          <meta
            name="og:description"
            content={filteredArticle.metaDescription}
          />
          <meta name="keywords" content={filteredArticle.metaKeys} />
          <meta property="og:url" content={currentUrl} />
        </Head>
      )}

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
        {filteredArticle ? (
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
        ) : (
          <CircularProgress />
        )}
      </div>
    </Fragment>
  );
}

export default BlogDetail;
