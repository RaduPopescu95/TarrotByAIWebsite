import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import i18nextConfig from "../../../next-i18next.config";
import LanguageSwitch from "../../LangSwitch/Menu";
import { getLocaleAbbreviation } from "../../../lib/localeFlags";

function Settings(props) {
  const [open, setOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState("");
  const anchorRef = useRef(null);
  const router = useRouter();

  const { t, i18n } = useTranslation("common");
  const { toggleDark, toggleDir, invert, isMobile } = props;

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") || "en";
    setCurrentLocale(savedLocale);
  }, []);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (
      event &&
      event.target &&
      anchorRef.current &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (anchorRef.current && !anchorRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div style={{ ...styles.setting, margin: isMobile && 20 }}>
      <button
        ref={anchorRef}
        aria-describedby={open ? "settings-popper" : undefined}
        aria-label="Settings"
        onClick={handleToggle}
        style={styles.iconButton}
      >
        <span style={styles.langAbbrBadge}>
          {getLocaleAbbreviation(router.locale || i18n.language)}
        </span>
      </button>
      
      {open && (
        <div style={styles.popper} id="settings-popper">
          <div style={{
            ...styles.paper,
            backgroundColor: props.isWhiteBg ? "#667eea" : "white",
          }}>
            <ul style={styles.list}>
              {i18nextConfig.i18n.locales.map((locale) => (
                <LanguageSwitch
                  ssg={i18nextConfig.ssg}
                  locale={locale}
                  key={locale}
                  checked={locale === (router.locale || "")}
                  toggleDir={toggleDir}
                  closePopup={handleClose}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  setting: {
    position: "relative",
    display: "inline-block",
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  langAbbrBadge: {
    minWidth: "40px",
    height: "40px",
    padding: "0 8px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "38px",
    textAlign: "center",
    color: "inherit",
  },
  popper: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 1000,
    minWidth: "200px",
    marginTop: "8px",
  },
  paper: {
    padding: "8px",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e0e0e0",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
  },
};

Settings.propTypes = {
  toggleDark: PropTypes.func,
  toggleDir: PropTypes.func,
  invert: PropTypes.bool,
};

Settings.defaultProps = {
  toggleDark: () => {},
  toggleDir: () => {},
  invert: false,
};

export default Settings;
