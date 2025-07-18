import React, { useState } from "react";
import { useRouter } from "next/router";
import { setCookie } from "../../utils/cookies";
import { useTranslation } from "next-i18next";
import { imgAPI } from "../../utils/images";
import languageDetector from "../../lib/languageDetector";

const options = [
  { value: "en", label: "English", flag: "/flags/us.png" },
  { value: "ro", label: "Romana", flag: "/flags/ro.png" },
  { value: "es", label: "Español", flag: "/flags/es.png" },
  { value: "de", label: "Deutsch", flag: "/flags/de.png" },
  { value: "fr", label: "Français", flag: "/flags/fr.png" },
  { value: "it", label: "Italiano", flag: "/flags/it.png" },
  { value: "pt", label: "Português", flag: "/flags/pt.png" },
  { value: "nl", label: "Nederlands", flag: "/flags/nl.png" },
  { value: "pl", label: "Polski", flag: "/flags/pl.png" },
  { value: "ru", label: "Русский", flag: "/flags/ru.png" },
  { value: "hu", label: "Magyar", flag: "/flags/hu.png" },
  { value: "sv", label: "Svenska", flag: "/flags/sv.png" },
  { value: "da", label: "Dansk", flag: "/flags/da.png" },
  { value: "no", label: "Norsk", flag: "/flags/no.png" },
  { value: "fi", label: "Suomi", flag: "/flags/fi.png" },
  { value: "is", label: "Íslenska", flag: "/flags/is.png" },
  { value: "cs", label: "Čeština", flag: "/flags/cs.png" },
  { value: "sk", label: "Slovenčina", flag: "/flags/sk.png" },
  { value: "sl", label: "Slovenščina", flag: "/flags/sl.png" },
  { value: "hr", label: "Hrvatski", flag: "/flags/hr.png" },
  { value: "bg", label: "Български", flag: "/flags/bg.png" },
  { value: "lt", label: "Lietuvių", flag: "/flags/lt.png" },
  { value: "lv", label: "Latviešu", flag: "/flags/lv.png" },
  { value: "et", label: "Eesti", flag: "/flags/et.png" },
  { value: "mt", label: "Malti", flag: "/flags/mt.png" },
  { value: "el", label: "Ελληνικά", flag: "/flags/el.png" },
  { value: "ar", label: "العربية", flag: "/flags/ar.png" },
  { value: "he", label: "עברית", flag: "/flags/he.png" },
  { value: "hi", label: "हिन्दी", flag: "/flags/hi.png" },
  { value: "tr", label: "Türkçe", flag: "/flags/tr.png" },
  { value: "zh", label: "中文", flag: "/flags/zh.png" },
  { value: "ja", label: "日本語", flag: "/flags/ja.png" },
  { value: "ko", label: "한국어", flag: "/flags/ko.png" },
  { value: "th", label: "ไทย", flag: "/flags/th.png" },
  { value: "vi", label: "Tiếng Việt", flag: "/flags/vi.png" },
  { value: "id", label: "Bahasa Indonesia", flag: "/flags/id.png" },
  { value: "ms", label: "Bahasa Melayu", flag: "/flags/ms.png" },
];

export default function SelectLang() {
  const { t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const detectedLng = languageDetector.detect();

  const handleLanguageChange = (lang) => {
    setCookie("next-i18next", lang);
    
    const pathname = router.pathname;
    const query = router.query;
    
    router.push({ pathname, query }, router.asPath, { locale: lang });
    setIsOpen(false);
  };

  const currentLanguage = options.find(option => option.value === detectedLng) || options[0];

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
                  ...(option.value === detectedLng && styles.optionActive)
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
