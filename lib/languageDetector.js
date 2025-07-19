import languageDetector from "next-language-detector";
import i18nextConfig from "../next-i18next.config";

// Debug logging only in development or when explicitly enabled
const shouldLog = process.env.NODE_ENV === 'development' || process.env.ENABLE_I18N_LOGS === 'true';

if (shouldLog) {
  console.log('🔧 [INIT] languageDetector.js loaded:', {
    defaultLocale: i18nextConfig.i18n.defaultLocale,
    supportedLngs: i18nextConfig.i18n.locales,
    env: process.env.NODE_ENV,
    isServer: typeof window === 'undefined',
    isVercel: !!process.env.VERCEL
  });
}

// Create detector with simplified configuration for Vercel
const detector = languageDetector({
  supportedLngs: i18nextConfig.i18n.locales,
  fallbackLng: i18nextConfig.i18n.defaultLocale,
  // Simplified detection order for better Vercel compatibility
  detection: {
    order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
    caches: ['cookie', 'localStorage'],
    lookupCookie: 'NEXT_LOCALE',
    lookupLocalStorage: 'locale',
    checkWhitelist: true
  }
});

// Enhanced detector with proper error handling for Vercel
const enhancedDetector = {
  detect: (...args) => {
    try {
      const detected = detector.detect(...args) || i18nextConfig.i18n.defaultLocale;
      
      // Ensure detected language is supported
      const isSupported = i18nextConfig.i18n.locales.includes(detected);
      const finalLang = isSupported ? detected : i18nextConfig.i18n.defaultLocale;
      
      if (shouldLog) {
        console.log('🎯 [DETECTOR] Language detected:', {
          detected: finalLang,
          originalDetected: detected,
          isSupported,
          fallback: i18nextConfig.i18n.defaultLocale,
          supportedLngs: i18nextConfig.i18n.locales,
          isClient: typeof window !== 'undefined',
          browserLang: typeof window !== 'undefined' ? window.navigator.language : 'SSR',
          environment: process.env.NODE_ENV,
          isVercel: !!process.env.VERCEL
        });
      }
      
      return finalLang;
    } catch (error) {
      if (shouldLog) {
        console.error('❌ [DETECTOR] Detection failed:', error);
      }
      return i18nextConfig.i18n.defaultLocale;
    }
  },
  
  cache: (...args) => {
    try {
      if (shouldLog) {
        console.log('💾 [DETECTOR] Caching language:', args);
      }
      return detector.cache(...args);
    } catch (error) {
      if (shouldLog) {
        console.error('❌ [DETECTOR] Cache failed:', error);
      }
    }
  },
  
  cacheUserLanguage: (...args) => {
    try {
      if (shouldLog) {
        console.log('👤 [DETECTOR] Caching user language:', args);
      }
      return detector.cacheUserLanguage(...args);
    } catch (error) {
      if (shouldLog) {
        console.error('❌ [DETECTOR] Cache user language failed:', error);
      }
    }
  }
};

export default enhancedDetector;
