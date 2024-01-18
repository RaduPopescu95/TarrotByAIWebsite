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

import Link from "next/link";
// import { toUrlSlug } from "../utils/commonUtils";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices } from "../../data/servicesData";
import { colors } from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
// export async function getStaticProps() {
//   const services = await handleGetServices();
//   return {
//     props: {
//       services,
//     },
//     revalidate: 5, // Regenerează pagina la fiecare 10 secunde dacă este accesată
//   };
// }

// export async function getServerSideProps({ locale }) {
//   const services = await handleGetServices();
//   return {
//     props: {
//       services,
//       ...(await serverSideTranslations(locale, ["common", "services"])),
//     },
//   };
// }

// ... rest of your code

const MediaCardConstantService = ({
  item,
  isMiddleCard,
  index,
  flipAllCards,
}) => {
  const { t: tCommon } = useTranslation("common");
  const { t: tServices } = useTranslation("services");
  const route = useRouter();
  const maxLines = 4;

  // Starea pentru a gestiona afișarea fundalului alternativ
  const [flipped, setFlipped] = React.useState(false);

  // Funcția pentru a schimba starea la click pe card
  const handleFlip = () => {
    setFlipped(!flipped);
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
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, delay: delay },
    },
    exit: { x: 200, opacity: 0 },
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
        minHeight: "160px",
        minWidth: "auto",
        bottom: isMiddleCard ? 30 : 0,
        paddingRight: "11%",
        perspective: "1000px", // Adaugă perspectivă pentru efectul 3D
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleFlip}
    >
      {/* Partea din față a cartonașului */}
      <motion.div
        style={{
          position: "absolute",
          backfaceVisibility: "hidden",
          width: "100%", // Asigură-te că ocupă întregul container
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
          style={{
            objectFit: "cover",
            width: "auto",
            height: "100%", // Ajustează dacă este necesar pentru a se potrivi nevoilor tale
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </motion.div>

      {/* Partea din spate a cartonașului */}
      <motion.div
        style={{
          position: "absolute",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          width: "100%",
          height: "100%",
          /* Restul stilurilor pentru spate */
        }}
        variants={backVariants}
        initial="initial"
        animate="animate"
      >
        <img
          src={"/card-back.png"}
          alt={item.text}
          style={{
            objectFit: "cover",
            width: "auto",
            height: "100%", // Ajustează dacă este necesar pentru a se potrivi nevoilor tale
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </motion.div>
      <span
        style={{
          position: "relative",
          color: "white",
          zIndex: 1,
          top: 30,
          left: 10,
          marginTop: "auto", // Împinge textul în partea de jos a containerului
        }}
      >
        {item.text}
      </span>
    </motion.div>
  );
};

export function CitirePersonalizata({ services }) {
  const { currentUser, isGuestUser } = useAuth();
  const { t } = useTranslation("common", "services");
  const { classes, cx } = useSpacing();

  const [flipAllCards, setFlipAllCards] = React.useState(false);

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://mattealeconsulting.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const maxLines = 4; // Numărul maxim de rânduri dorit
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const cardTextStyles = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.4em", // Înălțimea unei linii
    maxHeight: `${maxLines * 1.4}em`, // Înălțime maximă calculată în funcție de numărul de rânduri
  };

  React.useEffect(() => {
    if (!currentUser && !isGuestUser) {
      router.push("login");
    }
  }, []);

  React.useEffect(() => {
    // Setează o întârziere pentru a permite tuturor cardurilor să termine animația de intrare
    const delay = constantServices.length * 0.15 + 0.5; // Ajustează această valoare dacă este necesar
    const timer = setTimeout(() => {
      setFlipAllCards(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, []);

  // Stil pentru cardurile din mijloc
  const middleCardStyle = {
    marginTop: "-20px", // Ajustează această valoare după necesitate
  };

  return (
    <>
      <Head>
        <title>Services | Matteale Consulting</title>
        <meta
          name="description"
          content="We are the SAP partner company that can support your journey to increase efficiency and features dedicated to the digital transformation of your enterprise."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Services | Matteale Consulting" />
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
      <div
        style={{
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
        }}
      >
        <section>
          <Header />
        </section>

        <section>
          <div style={{ paddingTop: "7%" }} className={classes.wraperSection}>
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
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              <AnimatePresence>
                {constantServices.map((item, index) => {
                  // Aplică stilul de sus pentru cardurile din mijloc
                  const isLastItem = index === constantServices.length - 1;
                  const isMiddleCard = index % 3 === 1 && !isLastItem; // Verifică dacă cardul este pe poziția din mijloc în rând
                  return (
                    <React.Fragment key={index}>
                      {isLastItem && (
                        // Adaugă un element gol/spacer înainte de ultimul card
                        <Grid item xs={12} sm={4} md={4} />
                      )}
                      <Grid
                        item
                        xs={12}
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
                        />
                      </Grid>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </Grid>
          </div>
        </section>
        {/* <section>
          <Footer />
        </section> */}
      </div>
    </>
  );
}

export default CitirePersonalizata;
