import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";
import CheckIcon from "@mui/icons-material/Check";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import ListItemText from "@mui/material/ListItemText";
import { useRouter } from "next/router";
import i18nextConfig from "../../next-i18next.config";
import languageDetector from "../../lib/languageDetector";

const LanguageSwitch = ({ locale, checked, toggleDir, ssg, closePopup }) => {
  const router = useRouter();
  const { t } = useTranslation("common");

  const changeLang = (lang) => {
    console.log(lang);
    languageDetector.cache(lang);
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
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: lang });
    }
  };

  // Definește calea către imagini pentru fiecare limbă (înlocuiește cu calea reală către imagini)
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
    // Adaugă aici alte limbi și căile către imaginile lor
  };

  return ssg ? (
    <ListItem role={undefined} dense button onClick={() => changeLang(locale)}>
      <ListItemIcon className="flag">
        <i className={locale} />
      </ListItemIcon>
      <ListItemText primary={t(locale)} />
      {checked && (
        <ListItemSecondaryAction>
          <CheckIcon color="primary" />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  ) : (
    <ListItem
      sx={{ zIndex: 10 }}
      role={undefined}
      dense
      button
      onClick={() => changeLang(locale)}
    >
      <img
        className="flag"
        src={flagImages[locale]} // Alege imaginea corespunzătoare limbii
        alt={locale}
        width={20}
        height={20}
        style={{ marginRight: 10 }}
      />
      <ListItemText
        primary={t(locale)}
        style={{ color: "white", zIndex: 10 }}
      />
      {checked && (
        <ListItemSecondaryAction>
          <CheckIcon color="primary" style={{ color: "rgb(255,192,69)" }} />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
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
