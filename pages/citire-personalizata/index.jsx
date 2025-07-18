import * as React from "react";
import Header from "../../components/Header";
import { useRouter } from "next/router";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, futureOptions } from "../../data/servicesData";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
import { toUrlSlug } from "../../utils/commonUtils";
import CitireViitorDialog from "../../components/DialogBox/CitireViitorDialog";
import { normalizeString } from "../../utils/strintText";
import {
  handleGetFirestoreSingleArrayData,
  handleQueryFirestore,
} from "../../utils/firestoreUtils";
import { useNumberContext } from "../../context/NumberContext";
import CitirePersonalizatDialog from "../../components/DialogBox/CitirePersonalizatDialog";
import languageDetector from "../../lib/languageDetector";
import { Sparkles } from "lucide-react";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

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
  const [isMobile, setIsMobile] = React.useState(false);

  // Check if mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Asociază fiecare categorie cu o carte, repetând cărțile dacă este necesar
  const card =
    shuffledCartiPersonalizate[index % shuffledCartiPersonalizate.length];

  console.log("carti PERSONALIZATE...", cartiPersonalizate);
  console.log("Card...", shuffledCartiPersonalizate);
  console.log("Card...", card);

  // Starea pentru a gestiona afișarea fundalului alternativ
  const [flipped, setFlipped] = React.useState(false);
  const { currentNumber, updateNumber, sendToHistory, setSendToHistory } =
    useNumberContext();

  // Funcția pentru a schimba starea la click pe card
  const getVariantaCarti = async (index) => {
    const card =
      shuffledCartiPersonalizate[index % shuffledCartiPersonalizate.length];
    const conditieCategorie = categoriiPersonalizate.arr[index];
    console.log("card...nou...", card);
    console.log("categorie...nou...", conditieCategorie);
    try {
      const cardNameNormalized = normalizeString(card.info.ro.nume);
      const categoryNameNormalized = normalizeString(
        conditieCategorie.info.ro.nume
      );

      const filteredVariante = await handleQueryFirestore(
        "VarianteCarti",
        "carte",
        cardNameNormalized,
        "categorie",
        categoryNameNormalized
      );

      // Verificare dacă există elemente în array-ul filtrat
      if (filteredVariante.length > 0) {
        // Selectare aleatorie a unui element
        const randomIndex = Math.floor(Math.random() * filteredVariante.length);
        const selectedCard = filteredVariante[randomIndex];

        // ---- START HISTORY ----
        if (currentNumber !== 0) {
          console.log("test...selected card....", selectedCard);
          setItem(selectedCard);
        } else if (currentNumber === 0) {
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
          getVariantaCarti(1);
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
        ...styles.cardContainer,
        bottom: isMiddleCard ? 30 : 0,
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Partea din față a cartonașului */}
      <motion.div
        style={styles.cardFront}
        variants={frontVariants}
        initial="initial"
        animate="animate"
      >
        <img
          src={"/card-back.png"}
          alt={item.text}
          style={styles.cardImage}
        />
      </motion.div>

      {/* Partea din spate a cartonașului */}
      <motion.div
        style={styles.cardBack}
        variants={backVariants}
        initial="initial"
        animate="animate"
      >
        {card && (
          <img
            src={card.image.finalUri}
            alt={item.text}
            style={styles.cardImage}
          />
        )}
      </motion.div>

      <div style={styles.cardLabel}>
        <span style={{...styles.cardLabelText, fontSize: isMobile ? '10px' : '16px'}}>
          {detectedLng === "hi"
            ? item.info.hu.nume
            : detectedLng === "id"
              ? item.info.ru.nume
              : item.info[detectedLng].nume}
        </span>
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

  const router = useRouter();

  // Check if mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.cristinazurba.ro";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const handleSetItem = (item) => {
    console.log("item....", item);
    setItem(item);
  };

  const getVariantaCarti = async (index) => {
    const card =
      shuffledCartiPersonalizate[index % shuffledCartiPersonalizate.length];
    const conditieCategorie = categoriiPersonalizate.arr[index];
    console.log("card...nou...", card);
    console.log(
      "categorie...nou...",
      conditieCategorie.info.ro.nume,
      currentNumber
    );
    try {
      const cardNameNormalized = normalizeString(card.info.ro.nume);
      const categoryNameNormalized = normalizeString(
        conditieCategorie.info.ro.nume
      );

      const filteredVariante = await handleQueryFirestore(
        "VarianteCarti",
        "carte",
        cardNameNormalized,
        "categorie",
        categoryNameNormalized
      );
 
      // Verificare dacă există elemente în array-ul filtrat
      if (filteredVariante.length > 0) {
        // Selectare aleatorie a unui element
        const randomIndex = Math.floor(Math.random() * filteredVariante.length);
        const selectedCard = filteredVariante[randomIndex];

        // ---- START HISTORY ----
        if (currentNumber !== 0) {
          console.log("test...selected card....", selectedCard);
          setTimeout(() => {
            setItem(selectedCard);
          }, 500);
        } else if (currentNumber === 0) {
          updateNumber(8);
          setTimeout(() => {
            setItem(selectedCard);
          }, 500);
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

  const handleVideoEnd = async () => {
    console.log("Video-ul s-a terminat nou!");
    setItem({});
    console.log("Videoclipul s-a terminat!");
    console.log("currentNumber...", currentNumber);
    switch (currentNumber) {
      case 1:
        await getVariantaCarti(4);
        updateNumber(4);
        break;
      case 4:
        await getVariantaCarti(7);
        updateNumber(7);
        break;
      case 7:
        await getVariantaCarti(5);
        updateNumber(5);
        break;
      case 5:
        await getVariantaCarti(2);
        updateNumber(2);
        break;
      case 2:
        await getVariantaCarti(6);
        updateNumber(6);
        break;
      case 6:
        await getVariantaCarti(3);
        updateNumber(3);
        break;
      case 3:
        await getVariantaCarti(0);
        updateNumber(0);
        break;
      case 0:
        await getVariantaCarti(8);
        updateNumber(8);
        break;
    }
  };

  const [visibleCards, setVisibleCards] = React.useState(
    new Array(categoriiPersonalizate.arr.length).fill(true)
  );

  React.useEffect(() => {
    setVisibleCards(new Array(categoriiPersonalizate.arr.length).fill(true));
  }, [shuffleCartiPersonalizate]);

  // Declanșarea animației de ieșire
  React.useEffect(() => {
    if (triggerExitAnimation) {
      setVisibleCards(new Array(categoriiPersonalizate.arr.length).fill(false));
    }
  }, [triggerExitAnimation, categoriiPersonalizate.arr.length]);

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

  React.useEffect(() => {
    console.log(
      "categorii personalizate.................//asdas......",
      categoriiPersonalizate
    );
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
        <title>Personal Reading | Cristina Zurba</title>
        <meta
          name="description"
          content="Embark on a journey of self-discovery with Cristina Zurba's personal readings. These tailored readings offer insights into your personal growth, challenges, and potential. Ideal for individuals seeking guidance and deeper understanding of their personal journey."
        />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9577714849380446"
          crossOrigin="anonymous"
        ></script>
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

      {/* Main wrapper with unified design */}
      <div style={styles.mainWrapper}>
        {/* Header */}
        <section>
          <Header />
        </section>

        {loading ? (
          /* Loading Spinner */
          <div style={styles.loadingContainer}>
            <motion.div animate={spinnerAnimation}>
              <div style={styles.spinnerIcon}>
                <Sparkles size={80} color="#667eea" />
              </div>
            </motion.div>
          </div>
        ) : (
          /* Main Content */
          <section>
            <div style={{
              ...styles.contentContainer,
              paddingTop: isMobile ? "30%" : "8%",
            }}>
              <div style={{
                ...styles.cardsGrid,
                width: isMobile ? "100%" : "90%",
                paddingLeft: isMobile ? 0 : 40,
                paddingRight: isMobile ? 0 : 40,
              }}>
                <AnimatePresence>
                  {categoriiPersonalizate.arr &&
                    categoriiPersonalizate.arr.map((item, index) => {
                      // Aplică stilul de sus pentru cardurile din mijloc
                      const isLastItem = index === constantServices.length - 1;
                      const isMiddleCard = index % 3 === 1 && !isLastItem; // Verifică dacă cardul este pe poziția din mijloc în rând
                      if (!visibleCards[index]) {
                        return null; // Nu afișa cardul dacă visibleCards la acest index este false
                      }
                      return (
                        <React.Fragment key={index}>
                          {isLastItem && (
                            // Adaugă un element gol/spacer înainte de ultimul card
                            <div style={styles.spacerItem} />
                          )}
                          <div style={styles.cardGridItem}>
                            <MediaCardConstantService
                              item={item}
                              isMiddleCard={isMiddleCard}
                              index={index}
                              flipAllCards={flipAllCards}
                              setItem={setItem}
                              setImageCard={setImageCard}
                              conditieCategorie={item.info.ro.nume}
                            />
                          </div>
                        </React.Fragment>
                      );
                    })}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* Dialog Component */}
        <CitirePersonalizatDialog
          item={item}
          setItem={setItem}
          imageCard={imageCard}
          setImageCard={setImageCard}
          handleVideoEnd={handleVideoEnd}
        />
      </div>
    </>
  );
}

// Styles matching /consultatii design
const styles = {
  mainWrapper: {
    background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
    minHeight: '100vh',
    overflow: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinnerIcon: {
    fontSize: '80px',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinnerText: {
    fontSize: '80px',
  },
  contentContainer: {
    height: '100%',
    marginBottom: '60px',
    justifyContent: 'center',
    display: 'flex',
    padding: '2rem 1rem',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: '30px',
    height: '100%',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      padding: '0 10px',
    },
  },
  cardGridItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacerItem: {
    // Empty spacer for last item alignment
  },
  cardContainer: {
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 'auto',
    width: 'auto',
    perspective: '1000px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  cardFront: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    width: '100%',
    height: '100%',
  },
  cardBack: {
    backfaceVisibility: 'hidden',
    transform: 'rotateY(180deg)',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '40%',
    height: 'auto',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
  },
  cardLabel: {
    backgroundColor: '#667eea',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    marginTop: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  cardLabelText: {
    position: 'relative',
    textAlign: 'center',
    maxWidth: '100%',
    textOverflow: 'ellipsis',
    color: 'white',
    fontWeight: '600',
    fontSize: '16px',
  },
};

// Add responsive styles and hover effects
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    .card-container:hover {
      transform: translateY(-5px) scale(1.02);
    }
    
    .card-image:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }
    
    @media (max-width: 768px) {
      .cards-grid {
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 1rem !important;
      }
      
      .card-container {
        transform: scale(0.8);
      }
      
      .card-label {
        padding: 0.3rem 0.5rem !important;
        font-size: 10px !important;
      }
    }
    
    @media (max-width: 480px) {
      .card-container {
        transform: scale(0.7);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default CitirePersonalizata;
