import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  CircularProgress,
  Container,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
import { normalizeString } from "../../utils/strintText";
import {
  handleQueryFirestore,
  handleUploadFirestoreSubcollection,
} from "../../utils/firestoreUtils";
import { useNumberContext } from "../../context/NumberContext";
import CitirePersonalizatDialog from "../../components/DialogBox/CitirePersonalizatDialog";
import languageDetector from "../../lib/languageDetector";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { authentication, db } from "../../firebase";
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
  conditieCategorie,
}) => {
  const detectedLng = languageDetector.detect();

  const { classes, cx } = useSpacing();

  // Starea pentru a gestiona afișarea fundalului alternativ
  const [flipped, setFlipped] = React.useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { currentNumber, updateNumber, sendToHistory, setSendToHistory } =
    useNumberContext();

  // Funcția pentru a schimba starea la click pe card

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
    <div
      onClick={() => setItem(item)}
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
    >
      {/* Partea din spate a cartonașului */}

      <div
        style={{
          // position: "relative",
          backfaceVisibility: "hidden",

          width: "100%",
          height: "100%",
          display: "flex",

          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={item.carte.image.finalUri}
          alt={item.text}
          className={classes.cardImg}
        />
      </div>
    </div>
  );
};

const handleVideoEnd = () => {
  console.log("video end");
};

export function CitirePersonalizata() {
  const { currentUser, isGuestUser } = useAuth();
  const { t } = useTranslation("common");
  const { classes, cx } = useSpacing();
  const { currentNumber, updateNumber } = useNumberContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [images, setImages] = React.useState([]);

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

  const loadImages = async () => {
    setIsLoading(true);
    console.log("FutureReading............", authentication.currentUser.uid);
    try {
      const newQuery = query(
        collection(
          db,
          "Users",
          authentication.currentUser.uid,
          "PersonalReading"
        ),
        orderBy("date"),
        limit(5)
      );
      console.log("test............");
      const querySnapshot = await getDocs(newQuery);
      console.log("test1.1............");

      if (!querySnapshot.empty) {
        console.log("query is not empty...");
        const newImages = querySnapshot.docs.map((doc) => doc.data());
        newImages.sort((a, b) => b.createdAt - a.createdAt);

        setImages(newImages);
      }
      console.log("test 2............");
    } catch (error) {
      console.error("Error fetching images: ", error);
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    loadImages();
    if (!currentUser && !isGuestUser) {
      router.push("login");
    }
  }, []);

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
          minHeight: "100vh",
        }}
      >
        <section>
          <Header />
        </section>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <div>
              <CircularProgress />
            </div>
          </div>
        ) : (
          <section>
            <div
              style={{
                paddingTop: isDesktop ? "8%" : "30%",
                height: "100%",
                marginBottom: "60px",
              }}
              className={classes.wraperSection}
            >
              {images.length > 0 &&
                images.map((i, index) => (
                  <Grid
                    key={index}
                    container
                    rowSpacing={0}
                    columnSpacing={0}
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      top: 30,
                      position: "relative",
                      paddingLeft: isDesktop ? 3 : 0,
                      paddingRight: isDesktop ? 3 : 0,
                      height: "100%",
                      backgroundColor: colors.primary3,
                      borderRadius: 5,
                      marginTop: index === 0 ? 0 : 1,
                    }}
                  >
                    <Grid
                      item
                      xs={1.3}
                      sm={1.3}
                      md={1.3}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "auto",
                        paddingTop: 2,
                        paddingBottom: 2,
                      }}
                    >
                      <h3 style={{ color: "white" }}>{i && i.date}</h3>
                    </Grid>
                    {i.data.map((item, index) => {
                      // Aplică stilul de sus pentru cardurile din mijloc

                      return (
                        <React.Fragment key={index}>
                          <Grid
                            item
                            xs={1.3}
                            sm={1.3}
                            md={1.3}
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "auto",
                              paddingTop: 2,
                              paddingBottom: 2,
                            }}
                          >
                            <MediaCardConstantService
                              item={item}
                              index={index}
                              flipAllCards={flipAllCards}
                              setItem={setItem}
                              setImageCard={setImageCard}
                            />
                          </Grid>
                        </React.Fragment>
                      );
                    })}
                  </Grid>
                ))}
            </div>
          </section>
        )}

        <CitirePersonalizatDialog
          item={item}
          setItem={setItem}
          imageCard={imageCard}
          setImageCard={setImageCard}
          handleVideoEnd={handleVideoEnd}
        />
        {/* <section>
          <Footer />
        </section> */}
      </div>
    </>
  );
}

export default CitirePersonalizata;
