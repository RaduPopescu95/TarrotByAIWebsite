import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import appTheme from "../theme/appTheme";
import { AuthProvider } from "../context/AuthContext";
import ApiDataProvider from "../context/ApiContext";
import { NumberProvider } from "../context/NumberContext";
import { appWithTranslation, useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import "./globals.css";
import { DatabaseProvider } from "../context/DatabaseContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import languageDetector from "../lib/languageDetector";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css"; // Importă doar CSS-ul pe server

import dynamic from "next/dynamic";

// Încarcă dinamica JavaScript-ul Bootstrap doar pe client

// Încarcă dinamica JavaScript-ul Bootstrap doar pe client
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

require("../client/assets/icons/fontawesome/css/fontawesome.min.css");
require("../client/assets/icons/fontawesome/css/all.min.css");
require("../client/assets/icons/feather/css/iconfont.css");
require("../client/assets/scss/main.scss");
require("../client/components/customstyleclient.css");
require("../client/assets/css/feather.css");

const defaultTheme = createTheme(appTheme("mainTheme", "light"));

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");

  useEffect(() => {
    // Verificăm dacă există o limbă salvată în localStorage
    const savedLocale = localStorage.getItem("locale");

    if (savedLocale && savedLocale !== router.locale) {
      // Dacă există o limbă salvată și este diferită de limba curentă a routerului,
      // actualizăm routerul pentru a folosi limba salvată
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, {
        locale: savedLocale,
        shallow: true,
      });
      // Actualizează limba în i18n
      // i18n.changeLanguage(savedLocale);
      // languageDetector.cache(savedLocale);
    }
  }, []); // Dependințele goale înseamnă că efectul va rula o singură dată la încărcarea componentei

  return (
    <DatabaseProvider>
      <AuthProvider>
        <ApiDataProvider>
          <NumberProvider>
            <CacheProvider value={createCache({ key: "css" })}>
              <ThemeProvider theme={defaultTheme}>
                <CssBaseline />
                <Component {...pageProps} />
              </ThemeProvider>
            </CacheProvider>
          </NumberProvider>
        </ApiDataProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

export default appWithTranslation(MyApp);
