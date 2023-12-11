import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useSpacing } from "~/theme/common";
import Header from "~/components/Header";
import Headline from "~/components/Blog/Headline";
import PostCard from "~/components/Cards/PostCard";
import Sidebar from "~/components/Blog/Sidebar";
import Footer from "~/components/Footer";

import link from "~/public/text/link";

import { useState } from "react";
import { useEffect } from "react";
import { Fragment } from "react";

import { handleGetArticles } from "../../utils/realtimeUtils";
import { useRouter } from "next/router";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { wappPhone } from "../../data/data";

// export async function getStaticProps() {
//   const articles = await handleGetArticles();
//   return {
//     props: {
//       articles,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

export async function getServerSideProps() {
  const articles = await handleGetArticles();
  return {
    props: {
      articles,
    },
  };
}

function BlogHome(props) {
  const { classes } = useSpacing();
  const { articles } = props;

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  // In your component
  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  // Calculează indexul de start și de sfârșit pentru articolele de pe pagina curentă
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Extrage articolele de pe pagina curentă
  const articlesToDisplay =
    articles.articlesArray &&
    articles.articlesArray.slice(startIndex, endIndex);

  return (
    <Fragment>
      <Head>
        <title>News | Matteale Consulting</title>
        <meta
          name="description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="News | Matteale Consulting" />
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
      <CssBaseline />
      <section id="home" />

      <Header home />
      <div
        className={classes.mainWrap}
        style={{
          paddingTop: isMobile ? 0 : 50,
          height: articles.articlesArray.length === 0 && "100vh",
        }}
      >
        <div className={classes.containerGeneral}>
          <Box pt={{ xs: 5, sm: 3, md: 4 }}>
            {articles.articlesArray.length > 0 ? (
              <Container>
                <Grid container spacing={3}>
                  <Grid item sm={12}>
                    <Headline newestArticle={articles.newestArticle} />
                  </Grid>
                </Grid>
                <Box mt={8}>
                  <Grid container spacing={3}>
                    {articles.latestArticles &&
                      articles.latestArticles.map((article, index) => (
                        <Grid item md={6} xs={12}>
                          <PostCard
                            href={link.starter.blogDetail}
                            img={article.image.finalUri}
                            title={article.name}
                            desc={article.metaDescription}
                            date={article.date}
                            id={article.id}
                            articleData={article}
                            orientation="landscape"
                            type="full"
                          />
                        </Grid>
                      ))}
                  </Grid>
                </Box>
                <Box mt={2}>
                  <Grid spacing={4} container>
                    <Grid item md={8} xs={12}>
                      {articlesToDisplay &&
                        articlesToDisplay.map((article, index) => (
                          <Box key={index.toString()} mt={index > 0 ? 6 : 0}>
                            <PostCard
                              href={link.starter.blogDetail}
                              img={article.image.finalUri}
                              title={article.name}
                              desc={article.metaDescription}
                              date={article.date}
                              id={article.id}
                              orientation="portrait"
                              type="round"
                            />
                          </Box>
                        ))}

                      <Box mt={5} className={classes.arrow}>
                        <Grid container justifyContent="space-between">
                          <Button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ArrowBackIcon />
                            Previous
                          </Button>
                          <Button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={
                              articles.articlesArray &&
                              endIndex >= articles.articlesArray.length
                            }
                          >
                            Next
                            <ArrowForwardIcon />
                          </Button>
                        </Grid>
                      </Box>
                    </Grid>
                    <Grid item md={4} xs={12}>
                      <Sidebar lastFiveArticles={articles.lastFiveArticles} />
                    </Grid>
                  </Grid>
                </Box>
              </Container>
            ) : (
              <Typography
                style={{
                  color: "white",
                  fontSize: "20px",
                  paddingTop: articles.articlesArray.length == 0 && 30,
                }}
                gutterBottom
                variant="body1"
                display="block"
              >
                We're brewing some fresh content! Check back soon to read our
                latest articles. In the meantime, explore our existing resources
                or subscribe to get updates.
              </Typography>
            )}
          </Box>
        </div>
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

export default BlogHome;
