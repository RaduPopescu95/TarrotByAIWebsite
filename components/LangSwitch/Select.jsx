import React, { useState } from "react";
import { useRouter } from "next/router";
import { setCookie } from "../../utils/cookies";
import languageDetector from "../../lib/languageDetector";
import i18nextConfig from "../../next-i18next.config";
import { getLocaleFlagSrc, getLocaleNativeLabel } from "../../lib/localeFlags";

const siteLocales = i18nextConfig.i18n.locales;
const options = siteLocales.map((value) => ({
  value,
  label: getLocaleNativeLabel(value),
  flag: getLocaleFlagSrc(value),
}));

export default function SelectLang() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const activeLocale =
    (router.isReady && router.locale) || languageDetector.detect() || siteLocales[0];

  const handleLanguageChange = (lang) => {
    setCookie("next-i18next", lang);
    
    const pathname = router.pathname;
    const query = router.query;
    
    router.push({ pathname, query }, router.asPath, { locale: lang });
    setIsOpen(false);
  };

  const currentLanguage =
    options.find((option) => option.value === activeLocale) || options[0];

  return (
    <div style={styles.container}>
      <div 
        style={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={currentLanguage.flag} 
          alt={currentLanguage.label}
          style={styles.flag}
        />
        <span style={styles.label}>{currentLanguage.label}</span>
        <i 
          className="fa fa-chevron-down" 
          style={{
            ...styles.chevron,
            ...(isOpen && styles.chevronOpen)
          }}
        />
      </div>
      
      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownContent}>
            {options.map((option) => (
              <div
                key={option.value}
                style={{
                  ...styles.option,
                  ...(option.value === activeLocale && styles.optionActive)
                }}
                onClick={() => handleLanguageChange(option.value)}
              >
                <img 
                  src={option.flag} 
                  alt={option.label}
                  style={styles.optionFlag}
                />
                <span style={styles.optionLabel}>{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    display: "inline-block",
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    padding: "8px 12px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    transition: "all 0.3s ease",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  flag: {
    width: "20px",
    height: "15px",
    marginRight: "8px",
    borderRadius: "2px",
    objectFit: "cover",
  },
  label: {
    marginRight: "8px",
    color: "white",
  },
  chevron: {
    fontSize: "12px",
    color: "white",
    transition: "transform 0.3s ease",
  },
  chevronOpen: {
    transform: "rotate(180deg)",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: "0",
    right: "0",
    zIndex: 1000,
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e9ecef",
    overflow: "hidden",
    marginTop: "4px",
  },
  dropdownContent: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  option: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: "#f8f9fa",
    },
  },
  optionActive: {
    backgroundColor: "#667eea",
    color: "white",
  },
  optionFlag: {
    width: "20px",
    height: "15px",
    marginRight: "8px",
    borderRadius: "2px",
    objectFit: "cover",
  },
  optionLabel: {
    fontSize: "14px",
    color: "inherit",
  },
};
