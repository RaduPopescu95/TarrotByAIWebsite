import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import i18nextConfig from "../../next-i18next.config";
import languageDetector from "../../lib/languageDetector";

const LanguageSwitch = ({ locale, checked, toggleDir, ssg, closePopup }) => {
  const [currentLocale, setCurrentLocale] = useState("");
  const router = useRouter();
  const { t } = useTranslation("common");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") || "en";
    setCurrentLocale(savedLocale);
  }, []);

  const changeLang = (lang) => {
    console.log(lang);
    languageDetector.cache(lang);
    localStorage.setItem("locale", lang);
    closePopup();

    if (i18nextConfig.ssg) {
      let href = router.asPath;
      let pName = router.pathname;
      Object.keys(router.query).forEach((k) => {
        if (k === "locale") {
          pName = pName.replace(`[${k}]`, lang);
          return;
        }
        pName = pName.replace(`[${k}]`, router.query[k]);
      });
      if (lang) {
        href = pName;
      }
      router.push(href);
    } else {
      console.log("lang...", lang);
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: lang });
    }
  };

  // Definește calea către imagini pentru fiecare limbă
  const flagImages = {
    en: "/flags/english.png",
    ro: "/flags/romania.png",
    bg: "/flags/bulgaria.png",
    hr: "/flags/croatia.png",
    cs: "/flags/czech.png",
    fr: "/flags/france.png",
    de: "/flags/germany.png",
    el: "/flags/greece.png",
    hi: "/flags/india.png",
    id: "/flags/indonesia.png",
    it: "/flags/italy.png",
    pl: "/flags/poland.png",
    sk: "/flags/slovakia.png",
    es: "/flags/spanish.png",
  };

  return ssg ? (
    <div 
      style={styles.listItem}
      onClick={() => changeLang(locale)}
    >
      <div style={styles.flag}>
        <i className={locale} />
      </div>
      <div style={styles.text}>
        {t(locale)}
      </div>
      {checked && (
        <div style={styles.checkIcon}>
          <i className="fa fa-check" style={{color: "#667eea"}} />
        </div>
      )}
    </div>
  ) : (
    <div
      style={styles.listItem}
      onClick={() => changeLang(locale)}
    >
      <img
        className="flag"
        src={flagImages[locale]}
        alt={locale}
        style={styles.flagImage}
      />
      <div style={styles.textWhite}>
        {t(locale)}
      </div>
      {checked && (
        <div style={styles.checkIcon}>
          <i className="fa fa-check" style={{color: "rgb(255,192,69)"}} />
        </div>
      )}
    </div>
  );
};

const styles = {
  listItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  flag: {
    marginRight: "10px",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  flagImage: {
    width: "20px",
    height: "20px",
    marginRight: "10px",
    borderRadius: "2px",
    objectFit: "cover",
  },
  text: {
    flex: 1,
    fontSize: "14px",
    color: "#333",
    zIndex: 10,
  },
  textWhite: {
    flex: 1,
    fontSize: "14px",
    color: "white",
    zIndex: 10,
  },
  checkIcon: {
    marginLeft: "auto",
    fontSize: "16px",
  },
};

LanguageSwitch.propTypes = {
  locale: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  toggleDir: PropTypes.func.isRequired,
  closePopup: PropTypes.func.isRequired,
  ssg: PropTypes.bool,
};

LanguageSwitch.defaultProps = {
  ssg: false,
};

export default LanguageSwitch;
