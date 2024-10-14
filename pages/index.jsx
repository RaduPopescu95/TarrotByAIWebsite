import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";
import Head from "next/head";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useSpacing } from "../theme/common";
import Header from "../components/Header";
import Headline from "../components/Blog/Headline";
import PostCard from "../components/Cards/PostCard";
import Sidebar from "../components/Blog/Sidebar";

import { useState } from "react";
import { useEffect } from "react";
import { Fragment } from "react";

import { handleGetArticles } from "../utils/realtimeUtils";
import { useRouter } from "next/router";
import {
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import languageDetector from "../lib/languageDetector";
import { useTranslation } from "next-i18next";
import {
  handleGetFirestore,
  handleQueryFirestore,
} from "../utils/firestoreUtils";
import { colors } from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import { useApiData } from "../context/ApiContext";
import FilterBar from "../components/Blog/FilterBar/FilterBar";
import { useDatabase } from "../context/DatabaseContext";
import { filterArticlesBeforeCurrentTime } from "../utils/commonUtils";
import Footer from "../components/Footer";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase";
import HeadlineConsultatii from "../components/Blog/HeadlineConsultatii";

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
  let PAGE_SIZE = 12;
  console.log("Start fetch...");
  let articlesRef = collection(db, "BlogArticole");
  let q = query(
    articlesRef,
    orderBy("firstUploadTimestamp", "desc"),
    limit(PAGE_SIZE)
  );

  const documentSnapshots = await getDocs(q);
  let articlesData = documentSnapshots.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convertim firstUploadTimestamp la un format serializabil
      firstUploadTimestamp: data.firstUploadTimestamp
        ? data.firstUploadTimestamp.toDate().toISOString()
        : null,
    };
  });
  articlesData = filterArticlesBeforeCurrentTime(articlesData);

  const lastVisibleId =
    documentSnapshots.docs.length > 0
      ? documentSnapshots.docs[documentSnapshots.docs.length - 1].id
      : null;

  console.log("Articole...aici...", articlesData.length);
  let articles = {};
  if (articlesData.length > 0) {
    // Sortarea articolelor după data și ora lor
    const sortedArticles = articlesData.sort((a, b) => {
      // Combină data și ora într-un singur string și convertește-le în obiecte de tip Date
      const dateTimeA = new Date(`${a.firstUploadDate} ${a.firstUploadtime}`);
      const dateTimeB = new Date(`${b.firstUploadDate} ${b.firstUploadtime}`);

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
      lastVisibleId,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

function Landing(props) {
  const { articles: arti } = useDatabase();
  const { currentUser, isGuestUser } = useAuth();
  const {
    oreNorocoase,
    numereNorocoase,
    culoriNorocoase,
    citateMotivationale,
    categoriiViitor,
    cartiViitor,
    categoriiPersonalizate,
    cartiPersonalizate,
    loading,
    varianteCarti,
    error,
    fetchData,
    zilnicCitateMotivationale,
    blogData,
  } = useApiData();
  const { t } = useTranslation("common");
  const detectedLng = languageDetector.detect();

  const { classes } = useSpacing();
  const { articles, lastVisibleId } = props;

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://cristinazurba.com";

  // In your component
  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 4; // Setează numărul de articole pe pagină la 4
  const [lastVisible, setLastVisible] = useState(null);

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
    setFilterItem(filterItem); // Presupunând că ai o stare `filterItem` pentru a stoca categoria selectată

    let articlesData = [];
    if (filterItem === "All") {
      articlesData = articles.articlesData; // Dacă filtrul este "All", folosește toate articolele
    } else {
      // Filtrarea articolelor pe baza categoriei selectate
      articlesData = articles.articlesData.filter(
        (article) => article.categorie === filterItem
      );
    }

    // Sortarea articolelor filtrate după data și ora
    const sortedArticles = articlesData.sort((a, b) => {
      const dateTimeA = new Date(`${a.firstUploadDate} ${a.firstUploadtime}`);
      const dateTimeB = new Date(`${b.firstUploadDate} ${b.firstUploadtime}`);
      return dateTimeB - dateTimeA;
    });

    setCurrentPage(1); // Resetarea paginii curente la 1 după filtrare
    setFilteredArticles(sortedArticles); // Actualizează starea cu articolele filtrate și sortate
  };

  useEffect(() => {
    console.log("asdad.....");
    const newStartIndex = (currentPage - 1) * itemsPerPage;
    const newEndIndex = newStartIndex + itemsPerPage;
    const newArticlesToDisplay = filteredArticles.slice(
      newStartIndex,
      newEndIndex
    );

    setArticlesToDisplay(newArticlesToDisplay);
  }, [currentPage, filteredArticles]); // Ascultă modificările la `currentPage` și `filteredArticles`

  useEffect(() => {
    const loadInitialLastVisible = async () => {
      if (lastVisibleId) {
        const lastVisibleDocRef = doc(db, "BlogArticole", lastVisibleId);
        const lastVisibleSnapshot = await getDoc(lastVisibleDocRef);
        if (lastVisibleSnapshot.exists()) {
          setLastVisible(lastVisibleSnapshot);
        } else {
          console.log("Nu s-a găsit documentul pentru lastVisibleId.");
        }
      }
    };

    loadInitialLastVisible();
  }, [lastVisibleId]); // Dependența de lastVisibleId asigură că efectul se rulează la încărcarea componentei

  //   useEffect(() => {
  //     // handleAddToFirestore();
  //     const currentTime = new Date(); // Obține timpul actual
  // console.log("current time...", currentTime)
  //     if (!currentUser && !isGuestUser) {
  //       router.push("login");
  //     }
  //   }, []);

  //   if ((!currentUser && !isGuestUser) || loading) {
  //     return (
  //       <div
  //         style={{
  //           display: "flex",
  //           justifyContent: "center",
  //           alignItems: "center",
  //           height: "100vh",
  //           width: "100%",
  //         }}
  //       >
  //         <CircularProgress color="secondary" sx={{ fontSize: "100px" }} />
  //       </div>
  //     );
  //   }

  useEffect(() => {
    if (!currentUser && !isGuestUser) {
      router.push("login");
    }
  }, []);

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
                  {/* <Grid container spacing={3}>
                    <Grid item sm={12}>
                      <HeadlineConsultatii isRo={false} />
                    </Grid>
                  </Grid> */}
                  <Grid container spacing={3} mt={8}>
                    <Grid item sm={12}>
                      <Headline newestArticle={lastArticle} isRo={false} />
                    </Grid>
                  </Grid>
                  <Box mt={8}>
                    <Grid container spacing={4}>
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
      <Footer />
    </Fragment>
  );
}

export default Landing;
