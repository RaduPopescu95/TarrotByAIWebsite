import languageDetector from "next-language-detector";
import i18nextConfig from "../next-i18next.config";

console.log('🔧 [INIT] languageDetector.js loaded:', {
  defaultLocale: i18nextConfig.i18n.defaultLocale,
  supportedLngs: i18nextConfig.i18n.locales,
  env: process.env.NODE_ENV,
  isServer: typeof window === 'undefined'
});

const detector = languageDetector({
  fallbackLng: i18nextConfig.i18n.defaultLocale,
  supportedLngs: i18nextConfig.i18n.locales,
});

// Enhanced detector with logging
const enhancedDetector = {
  detect: (...args) => {
    try {
      const detected = detector.detect(...args);
      console.log('🎯 [DETECTOR] Language detected:', {
        detected,
        fallback: i18nextConfig.i18n.defaultLocale,
        supportedLngs: i18nextConfig.i18n.locales,
        isClient: typeof window !== 'undefined',
        browserLang: typeof window !== 'undefined' ? window.navigator.language : 'SSR',
        args
      });
      return detected;
    } catch (error) {
      console.error('❌ [DETECTOR] Detection failed:', error);
      return i18nextConfig.i18n.defaultLocale;
    }
  },
  
  cache: (...args) => {
    console.log('💾 [DETECTOR] Caching language:', args);
    return detector.cache(...args);
  },
  
  cacheUserLanguage: (...args) => {
    console.log('👤 [DETECTOR] Caching user language:', args);
    return detector.cacheUserLanguage(...args);
  }
};

export default enhancedDetector;
