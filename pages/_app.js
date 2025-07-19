import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import appTheme from "../theme/appTheme";
import { AuthProvider } from "../context/AuthContext";
import ApiDataProvider from "../context/ApiContext";
import { NumberProvider } from "../context/NumberContext";
import { appWithTranslation, useTranslation } from "next-i18next";
import "./globals.css";
import { DatabaseProvider } from "../context/DatabaseContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import languageDetector from "../lib/languageDetector";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";

// Load Bootstrap JavaScript only on client
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

// Import all required CSS
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

  // Debug logging only in development or when explicitly enabled
  const shouldLog = process.env.NODE_ENV === 'development' || process.env.ENABLE_I18N_LOGS === 'true';

  if (shouldLog) {
    console.log('🚀 [CLIENT] MyApp initialized:', {
      currentLocale: router.locale,
      routerReady: router.isReady,
      i18nLanguage: i18n?.language,
      i18nIsInitialized: i18n?.isInitialized,
      hasTranslations: !!t('hello'),
      testTranslation: t('hello'),
      availableLanguages: i18n?.options?.resources ? Object.keys(i18n.options.resources) : 'none',
      timestamp: new Date().toISOString(),
      isVercel: !!process.env.VERCEL,
      environment: process.env.NODE_ENV
    });
  }

  useEffect(() => {
    // Only run on client-side to avoid hydration issues
    if (typeof window === 'undefined' || !router.isReady) return;
    
    try {
      // Simple language synchronization
      const currentLocale = router.locale;
      const detectedLng = languageDetector.detect();

      if (shouldLog) {
        console.log('🔄 [CLIENT] Language sync:', {
          routerLocale: currentLocale,
          detectedLng,
          i18nLanguage: i18n?.language,
          needsSync: i18n?.language && i18n.language !== currentLocale
        });
      }

      // Ensure i18n is synced with router locale
      if (i18n?.language && i18n.language !== currentLocale && i18n.changeLanguage) {
        i18n.changeLanguage(currentLocale);
        languageDetector.cache(currentLocale);
      }

      // Save current locale for consistency
      if (currentLocale) {
        localStorage.setItem("locale", currentLocale);
        languageDetector.cache(currentLocale);
      }

    } catch (error) {
      if (shouldLog) {
        console.error('❌ [CLIENT] Language sync failed:', error);
      }
    }
  }, [router.isReady, router.locale, i18n]); // Simplified dependencies

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

export default appWithTranslation(MyApp);