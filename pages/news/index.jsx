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
import {
  handleGetFirestore,
  handleQueryFirestore,
} from "../../utils/firestoreUtils";
import { colors } from "../../utils/colors";
import FilterBar from "../../components/Blog/FilterBar/FilterBar";

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
  const itemsPerPage = 4; // Setează numărul de articole pe pagină la 4

  // Calculează indexul de start și de sfârșit pentru articolele de pe pagina curentă
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Extrage articolele de pe pagina curentă
  const [articlesToDisplay, setArticlesToDisplay] = useState(
    articles.articlesData
      ? articles.articlesData.slice(startIndex, endIndex)
      : []
  );
  const [lastArticle, setLastArticle] = useState(
    articles.lastArticle ? articles.lastArticle : []
  );
  const [latestArticles, setLatestArticles] = useState(
    articles.latestArticles ? articles.latestArticles : []
  );
  const [latestFiveArticles, setLatestFiverArticles] = useState(
    articles.latestFiveArticles ? articles.latestFiveArticles : []
  );

  const [filteredArticles, setFilteredArticles] = useState(
    articles.articlesData
  );

  const [filterItem, setFilterItem] = useState("All");

  const handleNextPage = () => {
    const newStartIndex = currentPage * itemsPerPage;
    if (newStartIndex < filteredArticles.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFilter = async (filterItem) => {
    setFilterItem(filterItem);
    let articlesData = [];
    if (filterItem === "All") {
      articlesData = await handleGetFirestore("BlogArticole");
    } else {
      articlesData = await handleQueryFirestore(
        "BlogArticole",
        "categorie",
        filterItem
      );
    }

    const sortedArticles = articlesData.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);
      return dateTimeB - dateTimeA;
    });

    setCurrentPage(1);
    setFilteredArticles(sortedArticles); // Actualizează starea cu articolele filtrate

    // Nu este necesar să actualizezi `articlesToDisplay` aici direct deoarece `useEffect` va face acest lucru
  };

  useEffect(() => {
    const newStartIndex = (currentPage - 1) * itemsPerPage;
    const newEndIndex = newStartIndex + itemsPerPage;
    const newArticlesToDisplay = filteredArticles.slice(
      newStartIndex,
      newEndIndex
    );

    setArticlesToDisplay(newArticlesToDisplay);
  }, [currentPage, filteredArticles]); // Ascultă modificările la `currentPage` și `filteredArticles`

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
          <div className={classes.containerGeneral}>
            <Box pt={{ xs: 5, sm: 3, md: 4 }}>
              {articles.articlesData.length > 0 ? (
                <Container style={{ minWidth: "80%" }}>
                  <Grid container spacing={3}>
                    <Grid item sm={12}>
                      <Headline newestArticle={lastArticle} isRo={false} />
                    </Grid>
                  </Grid>
                  <Box mt={8}>
                    <Grid container spacing={3}>
                      {latestArticles &&
                        latestArticles.map((article, index) => (
                          <Grid item md={6} xs={12} key={index}>
                            <PostCard
                              href={"sss"}
                              img={article.image.finalUri}
                              title={
                                detectedLng === "hi"
                                  ? article.info.hu.nume
                                  : detectedLng === "id"
                                    ? article.info.ru.nume
                                    : article.info[detectedLng].nume
                              }
                              desc={
                                detectedLng === "hi"
                                  ? article.info.hu.descriere
                                  : detectedLng === "id"
                                    ? article.info.ru.descriere
                                    : article.info[detectedLng].descriere
                              }
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
                        {articlesToDisplay &&
                          articlesToDisplay.map((article, index) => (
                            <Box key={index.toString()} mt={index > 0 ? 6 : 0}>
                              <PostCard
                                href={""}
                                img={article.image.finalUri}
                                title={
                                  detectedLng === "hi"
                                    ? article.info.hu.nume
                                    : detectedLng === "id"
                                      ? article.info.ru.nume
                                      : article.info[detectedLng].nume
                                }
                                desc={
                                  detectedLng === "hi"
                                    ? article.info.hu.descriere
                                    : detectedLng === "id"
                                      ? article.info.ru.descriere
                                      : article.info[detectedLng].descriere
                                }
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
                              onClick={handlePrevPage}
                              disabled={currentPage === 1}
                            >
                              <ArrowBackIcon />
                              Previous
                            </Button>
                            <Button
                              onClick={handleNextPage}
                              disabled={
                                articlesToDisplay &&
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
                        <FilterBar
                          handleFilter={handleFilter}
                          filterItem={filterItem}
                        />
                        <Sidebar lastFiveArticles={latestFiveArticles} />
                      </Grid>
                    </Grid>
                  </Box>
                </Container>
              ) : (
                <Typography
                  style={{
                    color: "white",
                    fontSize: "20px",
                    paddingTop: articlesToDisplay.length == 0 && 30,
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
        </div>
      </div>
    </Fragment>
  );
}

export default BlogHome;
