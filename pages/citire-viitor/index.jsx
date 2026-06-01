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
import languageDetector from "../../lib/languageDetector";
import { Star } from "lucide-react";
import AdPlacementShell from "../../components/Ads/AdPlacementShell";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
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
  // 🚀 FIX: Verificări defensive pentru datele din cache optimizat
  const card = (shuffledCartiViitor && Array.isArray(shuffledCartiViitor) && shuffledCartiViitor.length > 0)
    ? shuffledCartiViitor[index % shuffledCartiViitor.length]
    : null;
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

  // 🔍 [DEBUG LOGS] Pentru troubleshooting optimizări cache
  console.log("🔮 [CITIRE VIITOR] CartiViitor state:", {
    data: cartiViitor,
    type: typeof cartiViitor,
    hasArr: cartiViitor && cartiViitor.arr,
    arrLength: cartiViitor?.arr?.length,
    isArray: Array.isArray(cartiViitor)
  });
  
  console.log("🎯 [CITIRE VIITOR] CategoriiViitor state:", {
    data: categoriiViitor,
    type: typeof categoriiViitor,
    hasArr: categoriiViitor && categoriiViitor.arr,
    arrLength: categoriiViitor?.arr?.length
  });
  
  console.log("🃏 [CITIRE VIITOR] ShuffledCartiViitor state:", {
    data: shuffledCartiViitor,
    type: typeof shuffledCartiViitor,
    length: shuffledCartiViitor?.length,
    isArray: Array.isArray(shuffledCartiViitor)
  });
  
  console.log("🎴 [CITIRE VIITOR] Current card:", {
    card,
    index,
    cardExists: !!card
  });
  console.log("Card...", card);

  // Starea pentru a gestiona afișarea fundalului alternativ
  const [flipped, setFlipped] = React.useState(false);

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
        ...styles.cardContainer,
        bottom: isMiddleCard ? 30 : 0,
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleClick}
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
        {card && card.image && card.image.finalUri && (
          <img
            src={card.image.finalUri}
            alt={item.text}
            style={styles.cardImage}
          />
        )}
        {card && (!card.image || !card.image.finalUri) && (
          <div style={{
            ...styles.cardImage,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#999',
            fontSize: '12px'
          }}>
            Loading...
          </div>
        )}
      </motion.div>

      <div style={styles.cardLabel}>
        <span style={{...styles.cardLabelText, fontSize: isMobile ? '8px' : '14px'}}>
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

  // 🚀 FIX: Safe initialization pentru optimizările cache 
  const [visibleCards, setVisibleCards] = React.useState(() => {
    // Lazy initialization pentru a evita crash-ul pe undefined
    const length = categoriiViitor?.arr?.length || 8; // fallback la 8 carti default
    return new Array(length).fill(true);
  });

  React.useEffect(() => {
    // 🚀 FIX: Safe access pentru optimizările cache
    const length = categoriiViitor?.arr?.length || 8;
    setVisibleCards(new Array(length).fill(true));
  }, [shuffleCartiViitor]);

  // Declanșarea animației de ieșire
  React.useEffect(() => {
    if (triggerExitAnimation) {
      // 🚀 FIX: Safe access pentru optimizările cache
      const length = categoriiViitor?.arr?.length || 8;
      setVisibleCards(new Array(length).fill(false));
    }
  }, [triggerExitAnimation, categoriiViitor?.arr?.length]);

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
    // Access allowed without authentication
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
                <Star size={80} color="#667eea" />
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
              <AdPlacementShell placementId="banner1" />
              <div style={{
                ...styles.cardsGrid,
                width: isMobile ? "100%" : "90%",
                paddingLeft: isMobile ? 0 : 40,
                paddingRight: isMobile ? 0 : 40,
              }}>
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
                            <div style={styles.spacerItem} />
                          )}
                          {isFifthItem && (
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
                            />
                          </div>
                        </React.Fragment>
                      );
                    })}
                </AnimatePresence>
              </div>
              <AdPlacementShell placementId="banner2" />
            </div>
          </section>
        )}

        {/* Dialog Component */}
        <CitireViitorDialog
          item={item}
          setItem={setItem}
          imageCard={imageCard}
          setImageCard={setImageCard}
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
    // Empty spacer for item alignment
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
    width: '70%',
    height: 'auto',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
  },
  cardLabel: {
    backgroundColor: '#667eea',
    padding: '0.4rem 0.8rem',
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
    fontSize: '14px',
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
        padding: 0.2rem 0.4rem !important;
        font-size: 8px !important;
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
