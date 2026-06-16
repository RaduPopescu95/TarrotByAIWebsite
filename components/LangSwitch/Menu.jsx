import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import i18nextConfig from "../../next-i18next.config";
import languageDetector from "../../lib/languageDetector";
import { getLocaleAbbreviation } from "../../lib/localeFlags";

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

  return ssg ? (
    <div 
      style={styles.listItem}
      onClick={() => changeLang(locale)}
    >
      <span style={styles.abbrBadgeDark}>{getLocaleAbbreviation(locale)}</span>
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
      <span style={styles.abbrBadge}>{getLocaleAbbreviation(locale)}</span>
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
  abbrBadgeDark: {
    minWidth: "28px",
    height: "22px",
    padding: "0 6px",
    marginRight: "10px",
    borderRadius: "4px",
    border: "1px solid rgba(0, 0, 0, 0.15)",
    fontSize: "11px",
    fontWeight: "700",
    lineHeight: "20px",
    textAlign: "center",
    color: "#333",
  },
  abbrBadge: {
    minWidth: "28px",
    height: "22px",
    padding: "0 6px",
    marginRight: "10px",
    borderRadius: "4px",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    fontSize: "11px",
    fontWeight: "700",
    lineHeight: "20px",
    textAlign: "center",
    color: "white",
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
