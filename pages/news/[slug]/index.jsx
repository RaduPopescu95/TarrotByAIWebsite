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

  useEffect(() => {
    console.log("test....");
    console.log(detectedLng);

    if (router.isReady && articles) {
      const slug = router.query.slug;
      const id = slug.split("-")[0]; // Extract the ID part
      const filtered = articles.find((article) => article.id.toString() === id);
      setFilteredArticle(filtered); // Set the found article
    }
  }, [router.isReady, router.query.slug, articles]);
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
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
        }}
      >
        {filteredArticle ? (
          <div className={classes.mainWrap}>
            <section id="home" />
            <div className={classes.wraperSection} style={{ height: "100%" }}>
              <Box pt={5}>
                <Container>
                  <Grid container spacing={4}>
                    <Grid item md={12} xs={12}>
                      <Article filteredArticles={filteredArticle} />
                    </Grid>
                    {/* <Grid item md={4} xs={12}>
                    <Sidebar
                      lastFiveArticles={
                        detectedLng === "ro"
                          ? articles.lastFiveArticlesRo
                          : articles.lastFiveArticles
                      }
                      isRo={detectedLng === "ro" ? true : false}
                    />
                  </Grid> */}
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
