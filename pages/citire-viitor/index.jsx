import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import Header from "../../components/Header";
// import Footer from "../components/Footer";

import { useSpacing } from "../../theme/common";
import { useRouter } from "next/router";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

import Image from "next/image";
import StyleIcon from "@mui/icons-material/Style";
import Link from "next/link";
// import { toUrlSlug } from "../utils/commonUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, futureOptions } from "../../data/servicesData";
import { colors } from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
import { toUrlSlug } from "../../utils/commonUtils";
import CitireViitorDialog from "../../components/DialogBox/CitireViitorDialog";
import { Shuffle } from "@mui/icons-material";
import languageDetector from "../../lib/languageDetector";
// export async function getStaticProps() {
//   const services = await handleGetServices();
//   return {
//     props: {
//       services,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

// ... rest of your code

const MediaCardConstantService = ({
  item,
  isMiddleCard,
  index,
  flipAllCards,
  setImageCard,
  setItem,
}) => {
  const {
    oreNorocoase,
    numereNorocoase,
    culoriNorocoase,
    citateMotivationale,

    varianteCarti,
    categoriiPersonalizate,
    cartiPersonalizate,
    shuffleCartiPersonalizate,
    shuffledCartiPersonalizate,
    setShuffledCartiPersonalizate,
    loading,
    error,
    fetchData,
    triggerExitAnimation,
    startExitAnimation,
    resetExitAnimation,
    categoriiViitor,
    cartiViitor,
    shuffleCartiViitor,
    shuffledCartiViitor,
    setShuffledCartiViitor,
    setLoading,
  } = useApiData();

  // Asociază fiecare categorie cu o carte, repetând cărțile dacă este necesar
  const card = shuffledCartiViitor[index % shuffledCartiViitor.length];
  const { classes, cx } = useSpacing();
  const detectedLng = languageDetector.detect();

  console.log("carti viitor...", cartiViitor);
  console.log("Card...", shuffledCartiViitor);
  console.log("Card...", card);

  // Starea pentru a gestiona afișarea fundalului alternativ
  const [flipped, setFlipped] = React.useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Funcția pentru a schimba starea la click pe card
  const handleClick = () => {
    console.log(item);
    setItem(card);
    setImageCard(card && card.image.finalUri);
  };

  // Actualizează starea flipped bazată pe prop-ul flipAllCards
  React.useEffect(() => {
    if (flipAllCards) {
      setFlipped(true);
    }
  }, [flipAllCards]);

  // Definirea animațiilor
  const delay = index * 0.15; // De exemplu, întârziere de 0.1 secunde pentru fiecare card
  const variants = {
    initial: { x: -200, opacity: 0 },
    exit: {
      x: 200,
      opacity: 0,
      transition: { duration: 0.5, delay: delay }, // Măriți durata animației de ieșire
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, delay: delay },
    },
  };

  const frontVariants = {
    initial: { rotateY: 0 },
    animate: { rotateY: flipped ? 180 : 0, transition: { duration: 0.6 } },
  };

  const backVariants = {
    initial: { rotateY: -180 },
    animate: { rotateY: flipped ? 0 : -180, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      style={{
        borderRadius: 1,
        display: "flex",
        flexDirection: "column", // Modifică direcția de așezare a elementelor
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: "auto",
        width: "auto",

        bottom: isMiddleCard ? 30 : 0,

        perspective: "1000px", // Adaugă perspectivă pentru efectul 3D
        cursor: "pointer",
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleClick}
    >
      {/* Partea din față a cartonașului */}
      <motion.div
        style={{
          position: "absolute",
          backfaceVisibility: "hidden",
          width: "auto",
          height: "100%",

          /* Restul stilurilor pentru față */
        }}
        variants={frontVariants}
        initial="initial"
        animate="animate"
      >
        <img
          src={"/card-back.png"}
          alt={item.text}
          className={classes.cardImg}
        />
      </motion.div>

      {/* Partea din spate a cartonașului */}

      <motion.div
        style={{
          // position: "relative",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          width: "100%",
          height: "100%",
          display: "flex",

          alignItems: "center",
          justifyContent: "center",
        }}
        variants={backVariants}
        initial="initial"
        animate="animate"
      >
        {card && (
          <img
            src={card.image.finalUri}
            alt={item.text}
            className={classes.cardImg}
          />
        )}
      </motion.div>

      <div
        style={{
          backgroundColor: colors.primary3,
          padding: "0.3rem",
          borderRadius: 5,
          marginTop: 5,
        }}
      >
        <Typography
          style={{
            position: "relative", // Poziționare absolută în raport cu părintele relativ
            bottom: "0%", // Poziționează textul la jumătatea înălțimii containerului părinte
            left: 0, // Aliniază la stânga containerului părinte
            // bottom: -40, // Aliniază la dreapta containerului părinte
            textAlign: "flex-start", // Centrează textul orizontal
            maxWidth: "100%", // limitează lățimea maximă
            // whiteSpace: "nowrap", // împiedică întreruperea textului
            // overflow: "hidden", // ascunde textul care depășește lățimea maximă
            textOverflow: "ellipsis", // adaugă '...' dacă textul este prea lung
            color: colors.white,
            fontSize: isMobile ? 5 : 15,
          }}
        >
          {detectedLng === "hi"
            ? item.info.hu.nume
            : detectedLng === "id"
              ? item.info.ru.nume
              : item.info[detectedLng].nume}
        </Typography>
      </div>
    </motion.div>
  );
};

export function CitirePersonalizata({ services }) {
  const {
    oreNorocoase,
    numereNorocoase,
    culoriNorocoase,
    citateMotivationale,

    varianteCarti,
    categoriiPersonalizate,
    cartiPersonalizate,
    shuffleCartiPersonalizate,
    shuffledCartiPersonalizate,
    setShuffledCartiPersonalizate,
    loading,
    error,
    fetchData,
    triggerExitAnimation,
    startExitAnimation,
    resetExitAnimation,
    categoriiViitor,
    cartiViitor,
    shuffleCartiViitor,
    shuffledCartiViitor,
    setShuffledCartiViitor,
    setLoading,
  } = useApiData();
  const { currentUser, isGuestUser } = useAuth();

  const { classes, cx } = useSpacing();

  const [flipAllCards, setFlipAllCards] = React.useState(false);
  const [item, setItem] = React.useState({});
  const [imageCard, setImageCard] = React.useState("");

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.cristinazurba.ro";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const maxLines = 4; // Numărul maxim de rânduri dorit
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [visibleCards, setVisibleCards] = React.useState(
    new Array(categoriiViitor.arr.length).fill(true)
  );

  React.useEffect(() => {
    setVisibleCards(new Array(categoriiViitor.arr.length).fill(true));
  }, [shuffleCartiViitor]);

  // Declanșarea animației de ieșire
  React.useEffect(() => {
    if (triggerExitAnimation) {
      setVisibleCards(new Array(categoriiViitor.arr.length).fill(false));
    }
  }, [triggerExitAnimation, categoriiViitor.arr.length]);

  const isFirstEntry = React.useRef(true);

  React.useEffect(() => {
    if (isFirstEntry.current) {
      setLoading(true);
      shuffleCartiViitor();

      // Setează flag-ul pe false, astfel încât logica să nu se mai execute la următoarele intrări
      isFirstEntry.current = false;
    }
  }, []); // Array gol de dependențe pentru a rula doar la montare

  React.useEffect(() => {
    console.log("categoriiViitor........//asdas......", categoriiViitor);
    if (!currentUser && !isGuestUser) {
      router.push("login");
    }
  }, []);

  React.useEffect(() => {
    // Setează o întârziere pentru a permite tuturor cardurilor să termine animația de intrare
    const delay = constantServices.length * 0.15 + 0.5; // Ajustează această valoare dacă este necesar
    const timer = setTimeout(() => {
      setFlipAllCards(true);
    }, delay * 2700);

    return () => clearTimeout(timer);
  }, []);

  // Spinner animation
  const spinnerAnimation = {
    rotate: 360,
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  };

  return (
    <>
      <Head>
        <title>Future Reading | Cristina Zurba</title>
        <meta
          name="description"
          content="Explore the possibilities of your future with Cristina Zurba's insightful future readings. Dive into forecasts and guidance for what lies ahead, offering clarity and direction for your path forward. Ideal for those curious about their future and seeking enlightened guidance."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Future Reading | Cristina Zurba" />
        <meta
          property="og:description"
          content="Explore the possibilities of your future with Cristina Zurba's insightful future readings. Dive into forecasts and guidance for what lies ahead, offering clarity and direction for your path forward. Ideal for those curious about their future and seeking enlightened guidance."
        />
        <meta
          property="og:image"
          content="https://cristinazurba.com/images/social-share.jpg"
        />
        <meta name="format-detection" content="telephone=no" />
      </Head>
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

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <motion.div animate={spinnerAnimation}>
              <StyleIcon
                style={{ fontSize: 80, color: "white", height: "100vh" }}
              />
            </motion.div>
          </div>
        ) : (
          <section>
            <div
              style={{
                paddingTop: isDesktop ? "8%" : "30%",
                height: "100%",
                marginBottom: "60px",
                justifyContent: "center",
                display: "flex",
              }}
              className={classes.wraperSection}
            >
              <Grid
                container
                rowSpacing={isMobile ? 5 : 5}
                columnSpacing={0}
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  top: 30,
                  position: "relative",
                  paddingLeft: isDesktop ? 10 : 0,
                  paddingRight: isDesktop ? 10 : 0,
                  height: "100%",
                  width: isMobile ? "100%" : "90%",
                }}
              >
                <AnimatePresence>
                  {categoriiViitor.arr &&
                    categoriiViitor.arr.map((item, index) => {
                      // Aplică stilul de sus pentru cardurile din mijloc
                      const isLastItem = index === constantServices.length - 2;
                      const isFifthItem = index === constantServices.length - 4;
                      const isMiddleCard =
                        index % 3 === 1 && !isLastItem && !isFifthItem; // Verifică dacă cardul este pe poziția din mijloc în rând
                      if (!visibleCards[index]) {
                        return null; // Nu afișa cardul dacă visibleCards la acest index este false
                      }
                      return (
                        <React.Fragment key={index}>
                          {isLastItem && (
                            // Adaugă un element gol/spacer înainte de ultimul card
                            <Grid item xs={4} sm={4} md={4} />
                          )}
                          {isFifthItem && (
                            // Adaugă un element gol/spacer înainte de ultimul card
                            <Grid item xs={4} sm={4} md={4} />
                          )}
                          <Grid
                            item
                            xs={4}
                            sm={4}
                            md={4}
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <MediaCardConstantService
                              item={item}
                              isMiddleCard={isMiddleCard}
                              index={index}
                              flipAllCards={flipAllCards}
                              setItem={setItem}
                              setImageCard={setImageCard}
                            />
                          </Grid>
                        </React.Fragment>
                      );
                    })}
                </AnimatePresence>
              </Grid>
            </div>
          </section>
        )}

        <CitireViitorDialog
          item={item}
          setItem={setItem}
          imageCard={imageCard}
          setImageCard={setImageCard}
        />
        {/* <section>
          <Footer />
        </section> */}
      </div>
    </>
  );
}

export default CitirePersonalizata;
