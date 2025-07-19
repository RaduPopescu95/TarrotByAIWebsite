import React from "react";
import Link from "next/link";
import DropdownMenu from "./dropdownMenu";
import { useTranslation } from "next-i18next";
import { useI18nFallback } from "../../../lib/useI18nFallback";
import { useAuth } from "../../../context/AuthContext";
import { useApiData } from "../../../context/ApiContext";
import { useRouter } from "next/router";
import { useNumberContext } from "../../../context/NumberContext";

// SVG Icons as components
const StarIcon = ({ style, className, ...props }) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const StyleIcon = ({ style, className, onClick, ...props }) => (
  <svg
    style={style}
    className={className}
    onClick={onClick}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </svg>
);

const PersonIcon = ({ style, className, ...props }) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NewspaperIcon = ({ style, className, ...props }) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z" />
    <path d="M10 6h8" />
    <path d="M10 10h8" />
    <path d="M10 14h8" />
    <path d="M10 18h8" />
  </svg>
);

function NavBar({ fixed, style, fontSize, isMobile }) {
  const { currentNumber, updateNumber, sendToHistory, setSendToHistory } =
    useNumberContext();
  const navData = [
    "main-dashboard",
    "citire-personalizata",
    "settings",
    "news",
  ];
  const {
    shuffleCartiViitor,
    startExitAnimation,
    setLoading,
    shuffleCartiPersonalizate,
  } = useApiData();
  const router = useRouter();

  const isCurrentPathSpecial =
    router.pathname === "/citire-viitor" ||
    router.pathname === "/citire-personalizata";

  // Use fallback hook for better Vercel compatibility
  const { t: tf, i18n, isReady } = useI18nFallback();
  // Keep original hook as backup
  const { t: originalT } = useTranslation("common");
  
  // Use enhanced translation function that handles fallbacks
  const t = isReady ? originalT : tf;

  const handleStyleIconClick = () => {
    updateNumber(1);
    console.log("Star....exit...");
    startExitAnimation();
    setTimeout(() => {
      setLoading(true);
      if (router.pathname === "/citire-viitor") {
        shuffleCartiViitor();
      } else if (router.pathname === "/citire-personalizata") {
        shuffleCartiPersonalizate();
      }
    }, 1100);
  };

  const getIconStyles = (isActive, customFontSize) => ({
    fontSize: customFontSize || (isActive ? "70px" : "60px"),
    width: customFontSize || (isActive ? "70px" : "60px"),
    height: customFontSize || (isActive ? "70px" : "60px"),
    color: isActive ? "#667eea" : "#667eea",
    backgroundColor: isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.8)",
    borderRadius: "15px",
    padding: "10px",
    transition: "all 0.3s ease",
    cursor: "pointer",
    "&:hover": {
      fontSize: "80px",
      transform: "scale(1.1)",
    },
  });

  return (
    <ul style={style}>
      {!isMobile && (
        <div style={styles.storeContainer}>
          <Link href="https://play.google.com/store/apps/details?id=com.cristina.zurba.tarot">
            <img
              src={"/gplay.png"}
              alt="Google Play"
              style={styles.storeIconDesktop}
            />
          </Link>
          <p style={styles.storeLabel}>
            {t("android")}
          </p>
        </div>
      )}

      {navData.map((item, index) => {
        const isActive = router.pathname === `/${item.toLowerCase()}`;
        const iconStyle = getIconStyles(isActive, fontSize);
        
        return (
          <li key={index} style={styles.navItem}>
            {item === "citire-personalizata" && isCurrentPathSpecial ? (
              <StyleIcon
                style={{
                  ...iconStyle,
                  backgroundColor: "rgba(255, 255, 255, 1)",
                  color: "#667eea",
                }}
                onClick={handleStyleIconClick}
              />
            ) : (
              <Link
                href={`/${item.toLowerCase()}`}
                style={styles.navLink}
                onMouseEnter={(e) => {
                  e.target.style.borderBottomColor = "#FFF";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderBottomColor = "transparent";
                }}
                onClick={() => updateNumber(1)}
              >
                {item === "main-dashboard" ? (
                  <StarIcon style={iconStyle} />
                ) : item === "citire-personalizata" ? (
                  <StyleIcon style={iconStyle} />
                ) : item === "news" ? (
                  <NewspaperIcon style={iconStyle} />
                ) : (
                  <PersonIcon style={iconStyle} />
                )}
              </Link>
            )}
          </li>
        );
      })}
      
      {!isMobile && (
        <div style={styles.storeContainer}>
          <Link href="https://apps.apple.com/ro/app/cristina-zurba/id6475713937">
            <img
              src={"/appstore.png"}
              alt="App Store"
              style={styles.storeIconDesktop}
            />
          </Link>
          <p style={styles.storeLabel}>
            {t("ios")}
          </p>
        </div>
      )}
    </ul>
  );
}

const styles = {
  storeContainer: {
    height: "3rem",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: "7%",
  },
  storeIconDesktop: {
    width: "60px",
    height: "60px",
  },
  storeLabel: {
    margin: 0,
    bottom: 10,
    position: "relative",
    color: "white",
    backgroundColor: "rgba(40, 49, 64, 0.5)",
    paddingLeft: 5,
    paddingRight: 5,
    marginTop: 4,
    borderRadius: 8,
    fontSize: "12px",
  },
  navItem: {
    listStyle: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 8px",
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
};

export default NavBar;
