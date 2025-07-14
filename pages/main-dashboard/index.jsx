import * as React from "react";
import Header from "../../components/Header";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { constantServices, menuOptions } from "../../data/servicesData";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../context/ApiContext";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Footer from "../../components/Footer";
import { 
  Sparkles, 
  Star, 
  Dice6, 
  Palette, 
  Clock, 
  Heart, 
  Brain, 
  Smile, 
  BookOpen 
} from "lucide-react";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

const getServiceIcon = (route) => {
  const iconMap = {
    '/citire-personalizata': Sparkles,
    '/citire-viitor': Star,
    '/numar-norocos': Dice6,
    '/culoare-norocoasa': Palette,
    '/ora-norocoasa': Clock,
    '/citat-motivational': Heart,
    '/ce-gandeste': Brain,
    '/ce-simte': Smile,
    '/cartea-ta': BookOpen,
  };
  return iconMap[route] || Star;
};

const MediaCardConstantService = ({ item }) => {
  const { t: tCommon } = useTranslation("common");
  const route = useRouter();
  const [isMobile, setIsMobile] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
          <div
        className="service-card"
        onClick={() => route.push(item.route)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...styles.serviceCard,
          ...(isHovered ? styles.serviceCardHover : {}),
          fontSize: isMobile ? '14px' : '16px',
        }}
      >
              <div className="card-image-container" style={styles.cardImageContainer}>
          {/* Main Image */}
          <img
            className="main-card-image"
            src={"/dash-frame.png"}
            alt={item.text}
            style={{
              ...styles.mainCardImage,
              ...(isHovered ? styles.mainCardImageHover : {}),
            }}
          />
          {/* Golden Shadow Behind Image */}
          <div className="golden-shadow" style={{
            ...styles.goldenShadow,
            ...(isHovered ? styles.goldenShadowActive : {}),
          }}></div>
          {/* Icon Badge in top-right */}
          <div className="icon-badge" style={{
            ...styles.iconBadge,
            ...(isHovered ? styles.iconBadgeHover : {}),
          }}>
            {React.createElement(getServiceIcon(item.route), {
              size: 20,
              color: '#ffffff',
              className: 'service-icon'
            })}
          </div>
          {/* Text overlay on center */}
          <div style={styles.textOverlay}>
            <span className="card-text-overlay" style={styles.cardTextOverlay}>
              {item.text}
            </span>
          </div>
        </div>
      <div className="card-indicator" style={styles.cardIndicator}></div>
    </div>
  );
};

export function Landing({ services }) {
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
  } = useApiData();
  const { t } = useTranslation("common", "services");
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuOptions = [
    { text: t("personalReading"), route: "/citire-personalizata" },
    { text: t("futureReading"), route: "/citire-viitor" },
    { text: t("luckyNumber"), route: "/numar-norocos" },
    { text: t("luckyColor"), route: "/culoare-norocoasa" },
    { text: t("luckyHours"), route: "/ora-norocoasa" },
    { text: t("motivationalQuotes"), route: "/citat-motivational" },
    { text: t("CeGandeste"), route: "/ce-gandeste" },
    { text: t("CeSimte"), route: "/ce-simte" },
    { text: t("CarteaTa"), route: "/cartea-ta" },
  ];

  const router = useRouter();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://cristinazurba.com";

  const currentUrl = `${baseUrl}${router.asPath || ""}`;

  const handleAddToFirestore = async () => {
    const types = [
      { name: "CuloriNorocoase", arr: culoriNorocoase },
      // { name: "OreNorocoase", arr: oreNorocoase },
      // { name: "NumereNorocoase", arr: numereNorocoase },
      // { name: "CitateMotivationale", arr: citateMotivationale },
      // { name: "CategoriiViitor", arr: categoriiViitor },
      // { name: "CartiViitor", arr: cartiViitor },
      // { name: "CategoriiPersonalizate", arr: categoriiPersonalizate },
      // { name: "CartiPersonalizate", arr: cartiPersonalizate },
    ];
    console.log("culoriNorocoase..", culoriNorocoase);
    try {
      for (const type of types) {
        if (type.arr && type.arr.arr.length > 0) {
          console.log(`${type.name}.....xxx,,xxx...`, type.arr);

          const collectionName = type.name;
          const ref = doc(collection(db, collectionName));

          await setDoc(ref, type.arr);
          console.log(`Successfully added ${type.name} to Firestore.`);
        }
      }
    } catch (error) {
      console.error("Error adding data to Firestore:", error);
    }
  };

  React.useEffect(() => {
    // handleAddToFirestore();
  }, []);

  return (
    <>
      <Head>
        <title>Cristina Zurba</title>
        <meta
          name="description"
          content="Cristina Zurba is an interactive tarot card game website developed by well-known youtuber, tarot reader and astrologer Cristina Zurba."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9577714849380446"
          crossOrigin="anonymous"
        ></script>
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content="Cristina Zurba" />
        <meta
          property="og:description"
          content="Cristina Zurba is an interactive tarot card game website developed by well-known youtuber, tarot reader and astrologer Cristina Zurba."
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

        {/* Services Grid */}
        <section style={styles.servicesSection}>
          <div className="services-container" style={{...styles.servicesContainer, paddingTop: isMobile ? "10%" : "6%"}}>

            <div className="services-grid" style={styles.servicesGrid}>
              {menuOptions.map((item, index) => (
                <div key={index} style={styles.gridItem}>
                  <MediaCardConstantService item={item} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <section>
          <Footer />
        </section>
      </div>
    </>
  );
}

// Styles matching /consultatii design
const styles = {
  mainWrapper: {
    background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
    minHeight: '100vh',
    width: '100%',
  },
  servicesSection: {
    padding: '4rem 0 6rem 0',
  },
  servicesContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: '4rem',
  },
  mainTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '1rem',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
    fontWeight: '400',
    margin: 0,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 270px))',
    gap: '2rem',
    alignItems: 'start',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 240px))',
      gap: '1.5rem',
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
    },
  },
  gridItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  serviceCard: {
    background: 'transparent',
    borderRadius: '20px',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    border: 'none',
    textAlign: 'center',
  },
  serviceCardHover: {
    // No transform here since image container handles the hover effect
  },
  cardImageContainer: {
    width: '100%',
    maxWidth: '240px',
    aspectRatio: '5/4',
    position: 'relative',
    borderRadius: '18px',
    overflow: 'hidden',
    marginBottom: '1rem',
    backgroundColor: 'transparent',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    margin: '0 auto 1rem auto',
  },
  mainCardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'all 0.3s ease',
  },
  mainCardImageHover: {
    transform: 'scale(1.05)',
  },
  iconBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3), 0 0 0 3px rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 4,
    backdropFilter: 'blur(4px)',
  },
  iconBadgeHover: {
    transform: 'scale(1.1)',
    boxShadow: '0 8px 20px rgba(255, 215, 0, 0.4), 0 0 0 3px rgba(255, 255, 255, 1)',
    background: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
  },
  goldenShadow: {
    position: 'absolute',
    top: '-10px',
    left: '-10px',
    right: '-10px',
    bottom: '-10px',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    opacity: 0,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: -1,
    borderRadius: '25px',
    filter: 'blur(15px)',
  },
  goldenShadowActive: {
    opacity: 0.6,
    filter: 'blur(20px)',
    transform: 'scale(1.1)',
  },
  textOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 3,
    textAlign: 'center',
    width: '80%',
  },
  cardTextOverlay: {
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    lineHeight: '1.3',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 1rem 0',
    lineHeight: '1.4',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  cardIndicator: {
    width: '40px',
    height: '3px',
    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
    borderRadius: '2px',
    marginTop: 'auto',
    transition: 'all 0.3s ease',
  },
};



export default Landing;
