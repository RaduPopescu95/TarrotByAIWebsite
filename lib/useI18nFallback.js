import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";

// Fallback translations for critical text that might not load on Vercel
const fallbackTranslations = {
  ro: {
    hello: "Salut",
    Services: "Servicii",
    exploreServices: "Explorează serviciile",
    CeGandeste: "Ce Gandeste",
    CarteaTa: "Cartea ta",
    CeSimte: "Ce simte",
    readMore: "Citește mai mult",
    downloadThe: "Descarcă",
    appNow: "aplicația",
    android: "Android",
    ios: "iOS",
  },
  en: {
    hello: "Hello",
    Services: "Services", 
    exploreServices: "Explore services",
    CeGandeste: "What Thinks",
    CarteaTa: "Your Book",
    CeSimte: "What Feels",
    readMore: "Read More",
    downloadThe: "Download the",
    appNow: "App now",
    android: "Android",
    ios: "iOS",
  },
  bg: {
    hello: "Здравей",
    Services: "Услуги",
    exploreServices: "Разгледайте услугите",
    CeGandeste: "Какво мисли",
    CarteaTa: "Вашата книга",
    CeSimte: "Какво чувства",
    readMore: "Прочети повече",
    downloadThe: "Изтегли",
    appNow: "приложението",
    android: "Android",
    ios: "iOS",
  },
  es: {
    hello: "Hola",
    Services: "Servicios",
    exploreServices: "Explora servicios", 
    CeGandeste: "Lo que piensa",
    CarteaTa: "Tu libro",
    CeSimte: "Lo que siente",
    readMore: "Leer más",
    downloadThe: "Descargar",
    appNow: "la aplicación",
    android: "Android",
    ios: "iOS",
  },
  de: {
    hello: "Hallo",
    Services: "Dienstleistungen",
    exploreServices: "Dienstleistungen erkunden",
    CeGandeste: "Was denkt",
    CarteaTa: "Ihr Buch",
    CeSimte: "Was fühlt",
    readMore: "Mehr lesen",
    downloadThe: "Herunterladen",
    appNow: "die App",
    android: "Android",
    ios: "iOS",
  },
  fr: {
    hello: "Bonjour",
    Services: "Services",
    exploreServices: "Explorer les services",
    CeGandeste: "Ce qu'il pense",
    CarteaTa: "Votre livre",
    CeSimte: "Ce qu'il ressent",
    readMore: "Lire la suite",
    downloadThe: "Télécharger",
    appNow: "l'application",
    android: "Android",
    ios: "iOS",
  },
  it: {
    hello: "Ciao",
    Services: "Servizi",
    exploreServices: "Esplora i servizi",
    CeGandeste: "Cosa pensa",
    CarteaTa: "Il tuo libro",
    CeSimte: "Cosa sente",
    readMore: "Leggi di più",
    downloadThe: "Scarica",
    appNow: "l'app",
    android: "Android",
    ios: "iOS",
  },
  // Add more languages as needed
};

export function useI18nFallback() {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(router.locale || 'ro');

  // Memoized function to check i18n readiness
  const checkI18nReady = useCallback(() => {
    const hasResources = i18n?.options?.resources && Object.keys(i18n.options.resources).length > 0;
    const isInitialized = i18n?.isInitialized;
    const hasCorrectLanguageResources = i18n?.options?.resources?.[router.locale] || i18n?.options?.resources?.[i18n?.language];
    
    console.log('🔍 [I18N_FALLBACK] Checking i18n readiness:', {
      hasResources,
      isInitialized,
      hasCorrectLanguageResources: !!hasCorrectLanguageResources,
      currentLanguage: i18n?.language,
      routerLocale: router.locale,
      resourcesKeys: i18n?.options?.resources ? Object.keys(i18n.options.resources) : 'none',
      isLanguageMatching: i18n?.language === router.locale
    });

    const ready = hasResources && isInitialized && hasCorrectLanguageResources;
    setIsReady(ready);
    
    return ready;
  }, [i18n?.options?.resources, i18n?.isInitialized, i18n?.language, router.locale]);

  // Update current locale when router.locale changes
  useEffect(() => {
    if (router.locale && router.locale !== currentLocale) {
      console.log('🌍 [I18N_FALLBACK] Locale changed:', {
        from: currentLocale,
        to: router.locale,
        routerReady: router.isReady
      });
      setCurrentLocale(router.locale);
      
      // Force i18n sync if it's initialized but not matching
      if (i18n?.isInitialized && i18n?.language !== router.locale) {
        console.log('🔄 [I18N_FALLBACK] Forcing i18n sync on locale change');
        try {
          i18n.changeLanguage(router.locale);
        } catch (error) {
          console.error('❌ [I18N_FALLBACK] Failed to sync i18n on locale change:', error);
        }
      }
    }
  }, [router.locale, router.isReady, currentLocale, i18n]);

  useEffect(() => {
    checkI18nReady();

    // Re-check when language changes
    const handleLanguageChange = (lng) => {
      console.log('🔄 [I18N_FALLBACK] Language changed event:', {
        newLanguage: lng,
        routerLocale: router.locale,
        shouldSync: lng !== router.locale
      });
      
      // Update current locale if router hasn't caught up yet
      if (lng !== currentLocale) {
        setCurrentLocale(lng);
      }
      
      setTimeout(checkI18nReady, 100);
    };

    const handleResourcesLoaded = () => {
      console.log('✅ [I18N_FALLBACK] Resources loaded event');
      setTimeout(checkI18nReady, 50);
    };

    const handleFailedLoading = (lng, ns, msg) => {
      console.log('❌ [I18N_FALLBACK] Failed loading event:', { lng, ns, msg });
      setTimeout(checkI18nReady, 100);
    };

    if (i18n) {
      i18n.on('languageChanged', handleLanguageChange);
      i18n.on('loaded', handleResourcesLoaded);
      i18n.on('failedLoading', handleFailedLoading);
      i18n.on('initialized', checkI18nReady);
    }

    return () => {
      if (i18n) {
        i18n.off('languageChanged', handleLanguageChange);
        i18n.off('loaded', handleResourcesLoaded);
        i18n.off('failedLoading', handleFailedLoading);
        i18n.off('initialized', checkI18nReady);
      }
    };
  }, [i18n, checkI18nReady, router.locale, currentLocale]);

  // Enhanced translation function with fallback
  const tf = useCallback((key, options = {}) => {
    try {
      // First try normal translation
      const translation = t(key, options);
      
      // If we get back the key itself or it's exactly the same as the key, it means translation failed
      if (translation === key || !isReady || (!translation && translation !== "")) {
        const fallbackLocale = currentLocale || router.locale || 'ro';
        const fallback = fallbackTranslations[fallbackLocale]?.[key] || 
                        fallbackTranslations['ro'][key] || 
                        key;
        
        // Only log if we're actually using a fallback (not for empty strings)
        if (fallback !== key) {
          console.log(`⚠️ [I18N_FALLBACK] Using fallback for key "${key}":`, {
            locale: fallbackLocale,
            fallback,
            i18nReady: isReady,
            originalTranslation: translation,
            i18nLanguage: i18n?.language,
            routerLocale: router.locale
          });
        }
        
        return fallback;
      }
      
      return translation;
    } catch (error) {
      console.error(`❌ [I18N_FALLBACK] Translation error for key "${key}":`, error);
      
      // Return fallback in case of error
      const fallbackLocale = currentLocale || router.locale || 'ro';
      return fallbackTranslations[fallbackLocale]?.[key] || 
             fallbackTranslations['ro'][key] || 
             key;
    }
  }, [t, isReady, currentLocale, router.locale, i18n?.language]);

  return {
    t: tf,
    i18n,
    isReady,
    currentLocale,
    // Additional helper to force refresh
    refreshTranslations: checkI18nReady
  };
} 