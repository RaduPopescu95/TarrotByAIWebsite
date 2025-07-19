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

  // Log i18n initialization
  console.log('🚀 [CLIENT] MyApp initialized:', {
    currentLocale: router.locale,
    routerReady: router.isReady,
    i18nLanguage: i18n?.language,
    i18nIsInitialized: i18n?.isInitialized,
    hasTranslations: !!t('hello'),
    testTranslation: t('hello'),
    testServices: t('Services'),
    testExploreServices: t('exploreServices'),
    detectedLanguage: typeof window !== 'undefined' ? languageDetector.detect() : 'SSR',
    i18nResources: i18n?.options?.resources,
    loadedNamespaces: i18n?.options?.ns,
    // Detailed resource inspection
    availableLanguages: i18n?.options?.resources ? Object.keys(i18n.options.resources) : 'none',
    currentLangResources: i18n?.options?.resources?.[i18n?.language || router.locale],
    routerLangResources: i18n?.options?.resources?.[router.locale],
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔄 [CLIENT] useEffect triggered:', {
      routerReady: router.isReady,
      currentLocale: router.locale,
      windowDefined: typeof window !== 'undefined'
    });

    // Only run on client-side to avoid hydration issues on Vercel
    if (typeof window === 'undefined') return;
    
    try {
      // Verificăm dacă există o limbă salvată în localStorage
      const savedLocale = localStorage.getItem("locale");
      const detectedLng = languageDetector.detect();

      console.log('🌐 [CLIENT] Language detection:', {
        savedLocale,
        detectedLng,
        routerLocale: router.locale,
        routerReady: router.isReady,
        i18nCurrentLang: i18n?.language,
        shouldRedirect: savedLocale && savedLocale !== router.locale && router.isReady,
        needsI18nSync: i18n?.language && i18n.language !== router.locale
      });

      // Force i18n to sync with router locale if they differ
      if (i18n?.language && i18n.language !== router.locale && router.isReady) {
        console.log('🔄 [CLIENT] Syncing i18n language with router:', {
          from: i18n.language,
          to: router.locale,
          detectedLng,
          routerLocale: router.locale
        });
        
        try {
          i18n.changeLanguage(router.locale);
          console.log('✅ [CLIENT] i18n language synced successfully');
        } catch (error) {
          console.error('❌ [CLIENT] Failed to sync i18n language:', error);
        }
      }

      // Override detected language with router locale to prevent conflicts
      if (detectedLng !== router.locale && router.isReady && i18n?.isInitialized) {
        console.log('🔧 [CLIENT] Overriding detected language with router locale:', {
          detected: detectedLng,
          router: router.locale,
          forcing: true
        });
        
        try {
          i18n.changeLanguage(router.locale);
          // Also cache the correct language
          languageDetector.cache(router.locale);
        } catch (error) {
          console.error('❌ [CLIENT] Failed to override language:', error);
        }
      }

      if (savedLocale && savedLocale !== router.locale && router.isReady) {
        console.log('🔄 [CLIENT] Redirecting to saved locale:', {
          from: router.locale,
          to: savedLocale,
          pathname: router.pathname
        });

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
    } catch (error) {
      console.error('❌ [CLIENT] Language detection from localStorage failed:', error);
    }
  }, [router.isReady, router.locale]); // Wait for router to be ready

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