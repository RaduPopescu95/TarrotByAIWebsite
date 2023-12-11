import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { CircularProgress } from "@mui/material";
import { useSpacing } from "~/theme/common";
import Header from "~/components/Header";
import Article from "~/components/Blog/Article";
import Sidebar from "~/components/Blog/Sidebar";
import Footer from "~/components/Footer";
import brand from "~/public/text/brand";
import { useRouter } from "next/router";
import { useDatabase } from "../../../context/DatabaseContext";

function BlogDetail(props) {
  const { onToggleDark, onToggleDir } = props;
  const { classes } = useSpacing();
  const { articles } = useDatabase(); // Assuming this is a context hook for fetching articles
  const router = useRouter();
  const [filteredArticle, setFilteredArticle] = useState(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  useEffect(() => {
    console.log("test....");
    console.log(router.query.slug);
    if (router.isReady && articles.articlesArray) {
      const slug = router.query.slug;
      const id = slug.split("-")[0]; // Extract the ID part
      const filtered = articles.articlesArray.find(
        (article) => article.id.toString() === id
      );
      setFilteredArticle(filtered); // Set the found article
    }
  }, [router.isReady, router.query.slug, articles.articlesArray]);
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

      <Header onToggleDark={onToggleDark} onToggleDir={onToggleDir} home />
      {filteredArticle ? (
        <div className={classes.mainWrap}>
          <section id="home" />
          <div className={classes.wraperSection}>
            <Box pt={5}>
              <Container>
                <Grid container spacing={4}>
                  <Grid item md={8} xs={12}>
                    <Article filteredArticles={filteredArticle} />
                  </Grid>
                  <Grid item md={4} xs={12}>
                    <Sidebar lastFiveArticles={articles.lastFiveArticles} />
                  </Grid>
                </Grid>
              </Container>
            </Box>
          </div>
          <div id="footer">
            <Footer toggleDir={onToggleDir} />
          </div>
        </div>
      ) : (
        <CircularProgress />
      )}
    </Fragment>
  );
}

export default BlogDetail;
