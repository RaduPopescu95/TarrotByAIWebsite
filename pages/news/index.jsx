import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useSpacing } from "../../theme/common";
import Header from "../../components/Header";
import Headline from "../../components/Blog/Headline";
import PostCard from "../../components/Cards/PostCard";
import Sidebar from "../../components/Blog/Sidebar";

import { useState } from "react";
import { useEffect } from "react";
import { Fragment } from "react";

import { handleGetArticles } from "../../utils/realtimeUtils";
import { useRouter } from "next/router";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import languageDetector from "../../lib/languageDetector";
import { useTranslation } from "next-i18next";
import { handleGetFirestore } from "../../utils/firestoreUtils";
import { colors } from "../../utils/colors";

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
  // Obținerea datelor articolelor din Firestore
  const articlesData = await handleGetFirestore("BlogArticole");

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

  // Selectarea celui mai nou articol
  const lastArticle = sortedArticles[0]; // Primul articol din lista sortată este cel mai recent

  // Returnarea datelor către componenta Next.js
  const articles = { articlesData, latestArticles, lastArticle };
  return {
    props: {
      articles,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
function BlogHome(props) {
  const { t } = useTranslation("common");
  const detectedLng = languageDetector.detect();

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
    articles.articlesData && articles.articlesData.slice(startIndex, endIndex);
  const articlesToDisplayRo =
    articles.articlesData && articles.articlesData.slice(startIndex, endIndex);

  useEffect(() => {
    console.log("...----------testssss------.", articles.articlesData);
  }, []);
  // return;
  return (
    <Fragment>
      <Head>
        <title>News | Cristina Zurba</title>
        <meta
          name="description"
          content="Embark on a journey of self-discovery with Cristina Zurba's News. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="News | Cristina Zurba" />
        <meta
          property="og:description"
          content="Embark on a journey of self-discovery with Cristina Zurba's News. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <CssBaseline />
      <div
        style={{
          overflow: "auto",
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
          minHeight: "100vh",
        }}
      >
        <section>
          <Header />
        </section>
        <div
          // className={classes.mainWrap}
          style={{
            paddingTop: isMobile ? 0 : 50,
            height:
              articles.articlesData.length === 0 && detectedLng === "ro"
                ? "100vh"
                : "100%",
          }}
        >
          {detectedLng === "ro" ? (
            <div className={classes.containerGeneral}>
              <Box pt={{ xs: 5, sm: 3, md: 4 }}>
                {articles.articlesData.length > 0 ? (
                  <Container>
                    <Grid container spacing={3}>
                      <Grid item sm={12}>
                        <Headline
                          newestArticle={articles.lastArticle}
                          isRo={false}
                        />
                      </Grid>
                    </Grid>
                    <Box mt={8}>
                      <Grid container spacing={3}>
                        {articles.latestArticles &&
                          articles.latestArticles.map((article, index) => (
                            <Grid item md={6} xs={12}>
                              <PostCard
                                href={"sss"}
                                img={article.image.finalUri}
                                title={article.info[detectedLng].nume}
                                desc={article.info[detectedLng].descriere}
                                date={article.firstUploadDate}
                                id={article.id}
                                articleData={article}
                                orientation="landscape"
                                type="full"
                                isRo={true}
                              />
                            </Grid>
                          ))}
                      </Grid>
                    </Box>
                    <Box mt={2}>
                      <Grid spacing={4} container>
                        <Grid item md={8} xs={12}>
                          {articles.articlesData &&
                            articlesToDisplay.map((article, index) => (
                              <Box
                                key={index.toString()}
                                mt={index > 0 ? 6 : 0}
                              >
                                <PostCard
                                  href={""}
                                  img={article.image.finalUri}
                                  title={article.info[detectedLng].nume}
                                  desc={article.info[detectedLng].descriere}
                                  date={article.firstUploadDate}
                                  id={article.id}
                                  orientation="portrait"
                                  type="round"
                                  isRo={true}
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
                                  articles.articlesData &&
                                  endIndex >= articles.articlesData.length
                                }
                              >
                                Next
                                <ArrowForwardIcon />
                              </Button>
                            </Grid>
                          </Box>
                        </Grid>
                        <Grid item md={4} xs={12}>
                          <Sidebar />
                        </Grid>
                      </Grid>
                    </Box>
                  </Container>
                ) : (
                  <Typography
                    style={{
                      color: "white",
                      fontSize: "20px",
                      paddingTop: articles.articlesData.length == 0 && 30,
                    }}
                    gutterBottom
                    variant="body1"
                    display="block"
                  >
                    {detectedLng === "ro"
                      ? "Lucrăm la crearea unor conținuturi noi! Revino în curând pentru a citi cele mai recente articole. Între timp, explorează resursele noastre existente."
                      : `We're brewing some fresh content! Check back soon to read our
                    latest articles. In the meantime, explore our existing
                    resources.`}
                  </Typography>
                )}
              </Box>
            </div>
          ) : (
            <div className={classes.containerGeneral}>
              <Box pt={{ xs: 5, sm: 3, md: 4 }}>
                {articles.length > 0 ? (
                  <Container>
                    <Grid container spacing={3}>
                      <Grid item sm={12}>
                        <Headline newestArticle={articles.lastArticle} />
                      </Grid>
                    </Grid>
                    <Box mt={8}>
                      <Grid container spacing={3}>
                        {articles.latestArticles &&
                          articles.latestArticles.map((article, index) => (
                            <Grid item md={6} xs={12}>
                              <PostCard
                                href={""}
                                img={article.image.finalUri}
                                title={article.info[detectedLng].nume}
                                desc={article.info[detectedLng].descriere}
                                date={article.firstUploadDate}
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
                          {articles.articlesData &&
                            articlesToDisplay.map((article, index) => (
                              <Box
                                key={index.toString()}
                                mt={index > 0 ? 6 : 0}
                              >
                                <PostCard
                                  href={""}
                                  img={article.image.finalUri}
                                  title={article.info[detectedLng].nume}
                                  desc={article.info[detectedLng].descriere}
                                  date={article.firstUploadDate}
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
                                  articles && endIndex >= articles.length
                                }
                              >
                                Next
                                <ArrowForwardIcon />
                              </Button>
                            </Grid>
                          </Box>
                        </Grid>
                        <Grid item md={4} xs={12}>
                          <Sidebar />
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
                    We're brewing some fresh content! Check back soon to read
                    our latest articles. In the meantime, explore our existing
                    resources or subscribe to get updates.
                  </Typography>
                )}
              </Box>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}

export default BlogHome;
