import * as React from "react";
import Header from "../../components/Header";
import { useRouter } from "next/router";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Brain } from "lucide-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, futureOptions } from "../../data/servicesData";
import { colors } from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
import { toUrlSlug } from "../../utils/commonUtils";
import CitireViitorDialog from "../../components/DialogBox/CitireViitorDialog";
import { normalizeString } from "../../utils/strintText";
import { queryVarianteCartiUnified } from "../../utils/varianteCartiClient";
import { useNumberContext } from "../../context/NumberContext";
import CitirePersonalizatDialog from "../../components/DialogBox/CitirePersonalizatDialog";
import languageDetector from "../../lib/languageDetector";
import AdPlacementShell from "../../components/Ads/AdPlacementShell";

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
      ...(await serverSideTranslations(locale, ["common"])),
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
  const detectedLng = languageDetector.detect();

  // Asociază fiecare categorie cu o carte, repetând cărțile dacă este necesar
  // 🚀 FIX: Verificări defensive pentru datele din cache optimizat
  const card = (shuffledCartiPersonalizate && Array.isArray(shuffledCartiPersonalizate) && shuffledCartiPersonalizate.length > 0)
    ? shuffledCartiPersonalizate[index % shuffledCartiPersonalizate.length]
    : null;

  // 🔍 [DEBUG LOGS] Pentru troubleshooting optimizări cache
  console.log("🧠 [CE GANDESTE] CartiPersonalizate state:", {
    data: cartiPersonalizate,
    type: typeof cartiPersonalizate,
    hasArr: cartiPersonalizate && cartiPersonalizate.arr,
    arrLength: cartiPersonalizate?.arr?.length,
    isArray: Array.isArray(cartiPersonalizate)
  });
  
  console.log("🃏 [CE GANDESTE] ShuffledCartiPersonalizate state:", {
    data: shuffledCartiPersonalizate,
    type: typeof shuffledCartiPersonalizate,
    length: shuffledCartiPersonalizate?.length,
    isArray: Array.isArray(shuffledCartiPersonalizate)
  });
  
  console.log("🎯 [CE GANDESTE] CategoriiPersonalizate state:", {
    data: categoriiPersonalizate,
    type: typeof categoriiPersonalizate,
    hasArr: categoriiPersonalizate && categoriiPersonalizate.arr,
    arrLength: categoriiPersonalizate?.arr?.length
  });
  
  console.log("🎴 [CE GANDESTE] Current card:", {
    card,
    index,
    cardExists: !!card
  });
  console.log("Card...", card);

  // Starea pentru a gestiona afișarea fundalului alternativ
  const [flipped, setFlipped] = React.useState(false);
  
  // Replace MUI responsive hooks with vanilla JavaScript
  const [isMobile, setIsMobile] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 768);
    };
    
    handleResize(); // Set initial values
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { currentNumber, updateNumber, sendToHistory, setSendToHistory } =
    useNumberContext();

  // Funcția pentru a schimba starea la click pe card

  const getVariantaCarti = async (index) => {
    // 🚀 FIX: Verificări defensive pentru datele din cache optimizat
    if (!shuffledCartiPersonalizate || !Array.isArray(shuffledCartiPersonalizate) || shuffledCartiPersonalizate.length === 0) {
      console.error("❌ [CE GANDESTE] shuffledCartiPersonalizate not available:", shuffledCartiPersonalizate);
      return;
    }
    if (!categoriiPersonalizate || !categoriiPersonalizate.arr || !Array.isArray(categoriiPersonalizate.arr) || categoriiPersonalizate.arr.length === 0) {
      console.error("❌ [CE GANDESTE] categoriiPersonalizate not available:", categoriiPersonalizate);
      return;
    }
    
    const card =
      shuffledCartiPersonalizate[index % shuffledCartiPersonalizate.length];
    const conditieCategorie = categoriiPersonalizate.arr[index];
    console.log("card...nou...", card);
    console.log("categorie...nou...", conditieCategorie);
    try {
      // console.log(item.image.finalUri);

      const cardNameNormalized = normalizeString(card.info.ro.nume);
      const categoryNameNormalized = normalizeString("Ce gândește");

      const filteredVariante = await queryVarianteCartiUnified(
        cardNameNormalized,
        categoryNameNormalized
      );

      // Verificare dacă există elemente în array-ul filtrat
      if (filteredVariante.length > 0) {
        // Selectare aleatorie a unui element
        const randomIndex = Math.floor(Math.random() * filteredVariante.length);
        const selectedCard = filteredVariante[randomIndex];

        // ---- START HISTORY ----
        if (currentNumber !== 0) {
          // console.log("sendToHistory...currentnr < 8", sendToHistory);
          // let arr = [...sendToHistory];
          // arr.push(selectedCard);
          console.log("test...selected card....", selectedCard);
          setItem(selectedCard);
          // setSendToHistory([...arr]);
        } else if (currentNumber === 0) {
          // console.log("sendToHistory...currentnr === 8", sendToHistory);
          // let arr = [...sendToHistory];
          // arr.push(selectedCard);
          // const auth = authentication;
          // if (auth.currentUser) {
          // console.log("Is user...saving personal reading...");
          // const userLocation = `Users/${
          //   auth.currentUser ? auth.currentUser.uid : ""
          // }/PersonalReading`;
          // if (arr.length > 0) {
          //   handleUploadFirestoreSubcollection(arr, userLocation);
          // }
          // }

          //   // setSendToHistory([]);
          // console.log(item);
          updateNumber(8);
          setItem(selectedCard);
        }
      } else {
        console.log(
          "Nicio carte nu a fost găsită pentru criteriile specificate."
        );
      }
    } catch (err) {
      console.log("Error at navigateToPersonalizedReading...", err);
    }
  };

  // Actualizează starea flipped bazată pe prop-ul flipAllCards
  React.useEffect(() => {
    if (flipAllCards) {
      setFlipped(true);
      if (currentNumber === 1) {
        setTimeout(() => {
          getVariantaCarti(0);
        }, 1000);
      }
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
      onClick={() => getVariantaCarti(index)}
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "8px"
          }}
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
        {card && card.image && card.image.finalUri && (
          <img
            src={card.image.finalUri}
            alt={item.text}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "8px"
            }}
          />
        )}
        {card && (!card.image || !card.image.finalUri) && (
          <div style={{
            width: "100%",
            height: "100%",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#999',
            fontSize: '12px',
            borderRadius: "8px"
          }}>
            Loading...
          </div>
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
        <p
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
            fontSize: isMobile ? 20 : 20,
            margin: 0, // Remove default paragraph margin
            padding: 0, // Remove default paragraph padding
          }}
        >
          {detectedLng === "hi"
            ? item.info.hu.nume
            : detectedLng === "id"
              ? item.info.ru.nume
              : item.info[detectedLng].nume}
        </p>
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
  const { t } = useTranslation("common");
  const { currentNumber, updateNumber } = useNumberContext();

  const [flipAllCards, setFlipAllCards] = React.useState(false);
  const [item, setItem] = React.useState({});
  const [imageCard, setImageCard] = React.useState("");
  const [isMobile, setIsMobile] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.cristinazurba.ro";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  // Simple responsive check without MUI
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Set initial values
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSetItem = (item) => {
    console.log("item....", item);
    setItem(item);
  };

  const handleVideoEnd = async () => {
    console.log("Video-ul s-a terminat nou!");
    setItem({});
    console.log("Videoclipul s-a terminat!");
    console.log("currentNumber...", currentNumber);

    // Aici puteți adăuga orice logică suplimentară dorită după terminarea videoclipului
  };
  // Adaugă aici orice altă logică pe care dorești să o execuți

  const [visibleCards, setVisibleCards] = React.useState(
    new Array(1).fill(true)
  );

  React.useEffect(() => {
    setVisibleCards(new Array(1).fill(true));
  }, [shuffleCartiPersonalizate]);

  // Declanșarea animației de ieșire
  React.useEffect(() => {
    if (triggerExitAnimation) {
      setVisibleCards(new Array(1).fill(false));
    }
  }, [triggerExitAnimation, categoriiPersonalizate?.arr?.length]);

  const isFirstEntry = React.useRef(true);

  React.useEffect(() => {
    console.log("item....------...--..-..----......", item);
    if (isFirstEntry.current) {
      setLoading(true);
      shuffleCartiPersonalizate();
      console.log("Executat doar la prima ..intrare în acest ecran");

      // Setează flag-ul pe false, astfel încât logica să nu se mai execute la următoarele intrări
      isFirstEntry.current = false;
    }
  }, []); // Array gol de dependențe pentru a rula doar la montare

  // Access allowed without authentication

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
        <title>Personal Reading | Cristina Zurba</title>
        <meta
          name="description"
          content="Embark on a journey of self-discovery with Cristina Zurba's personal readings. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Personal Reading | Cristina Zurba" />
        <meta
          property="og:description"
          content="Embark on a journey of self-discovery with Cristina Zurba's personal readings. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
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
          background: "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)",
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
              height: "100vh",
              flexDirection: "column",
            }}
          >
            <motion.div animate={spinnerAnimation}>
              <Brain
                size={80}
                style={{ color: "#667eea", marginBottom: "20px" }}
              />
            </motion.div>
            <p style={{ color: "#667eea", fontSize: "1.2rem", marginTop: "20px" }}>
              Pregătesc viziunea în gândurile tale...
            </p>
          </div>
        ) : (
          <section style={{ padding: isDesktop ? "120px 0 40px 0" : "100px 0 60px 0" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>

              <AdPlacementShell placementId="reading" />
              
              {/* Two Column Layout for Desktop */}
              <div style={{
                display: isDesktop ? "grid" : "block",
                gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                gap: isDesktop ? "60px" : "0",
                alignItems: "center",
                minHeight: isDesktop ? "calc(50vh - 100px)" : "auto"
              }}>
                
                {/* Left Column - Hero Section */}
                <div style={{ 
                  textAlign: isDesktop ? "left" : "center", 
                  marginBottom: isDesktop ? "0" : "60px" 
                }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "50px",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "24px",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
                }}>
                  <Brain size={18} />
                  {t("whatTheyThink")}
                </div>
                
                <h1 style={{
                  fontSize: isMobile ? "2.5rem" : isDesktop ? "3.2rem" : "3.5rem",
                  fontWeight: "800",
                  color: "#1a202c",
                  margin: "0 0 16px 0",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  {t("discoverHiddenThoughts")}
                </h1>
                
                <p style={{
                  fontSize: "1.2rem",
                  color: "#64748b",
                  maxWidth: isDesktop ? "none" : "600px",
                  margin: isDesktop ? "0" : "0 auto",
                  lineHeight: "1.6"
                }}>
                  {t("hiddenThoughtsDescription")}
                </p>
                </div>

                {/* Right Column - Card Display */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: isDesktop ? "auto" : "400px"
                }}>
                <AnimatePresence>
                  {categoriiPersonalizate.arr &&
                    categoriiPersonalizate.arr.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6 }}
                        style={{
                          background: "white",
                          borderRadius: "24px",
                          padding: isDesktop ? "30px" : "40px",
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
                          border: "1px solid rgba(102, 126, 234, 0.1)",
                          position: "relative",
                          overflow: "visible",
                          maxWidth: isDesktop ? "380px" : "450px",
                          width: "100%"
                        }}
                      >
                        {/* Background Pattern */}
                        <div style={{
                          position: "absolute",
                          top: "-50%",
                          left: "-50%",
                          width: "200%",
                          height: "200%",
                          background: "linear-gradient(45deg, rgba(102, 126, 234, 0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(102, 126, 234, 0.03) 25%, transparent 25%)",
                          backgroundSize: "20px 20px",
                          zIndex: 0
                        }} />

                        {/* Floating Icon in Top Right Corner */}
                        <div style={{
                          position: "absolute",
                          top: "-15px",
                          right: "-15px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "50px",
                          height: "50px",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          borderRadius: "50%",
                          boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
                          zIndex: 1000
                        }}>
                          <Brain size={20} style={{ color: "white" }} />
                        </div>

                        {/* Card Content */}
                        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>

                          <MediaCardConstantService
                            item={categoriiPersonalizate.arr[0]}
                            isMiddleCard={false}
                            index={0}
                            flipAllCards={flipAllCards}
                            setItem={setItem}
                            setImageCard={setImageCard}
                            conditieCategorie={
                              categoriiPersonalizate.arr[0].info.ro.nume
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
                </div>
              </div>

              {/* Bottom Instructions - Only for Mobile */}
              {!isDesktop && (
                <div style={{
                  textAlign: "center",
                  background: "white",
                  borderRadius: "16px",
                  padding: "30px",
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(102, 126, 234, 0.1)",
                  marginTop: "40px"
                }}>
                  <h4 style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#1a202c",
                    marginBottom: "16px"
                  }}>
                    Cum să folosești această lectură
                  </h4>
                  <p style={{
                    fontSize: "1rem",
                    color: "#64748b",
                    lineHeight: "1.6",
                    marginBottom: "0"
                  }}>
                    Această lectură îți oferă perspective asupra gândurilor și intenționilor unei persoane importante pentru tine. 
                    Folosește aceste informații cu înțelepciune și compasiune.
                  </p>
                </div>
              )}
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
