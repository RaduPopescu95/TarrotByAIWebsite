import languageDetector from "next-language-detector";
import i18nextConfig from "../next-i18next.config";

const detector = languageDetector({
  fallbackLng: i18nextConfig.i18n.defaultLocale,
  supportedLngs: i18nextConfig.i18n.locales,
});

// Enhanced detector with Vercel compatibility
const enhancedDetector = {
  detect: () => {
    try {
      // Try original detector first
      const detected = detector.detect();
      
      // Fallback to browser language if available
      if (typeof window !== 'undefined') {
        const browserLang = window.navigator.language?.split('-')[0];
        if (i18nextConfig.i18n.locales.includes(browserLang)) {
          return browserLang;
        }
      }
      
      // Validate detected language
      if (detected && i18nextConfig.i18n.locales.includes(detected)) {
        return detected;
      }
      
      // Final fallback
      return i18nextConfig.i18n.defaultLocale;
    } catch (error) {
      console.warn('Language detection failed, using default:', error);
      return i18nextConfig.i18n.defaultLocale;
    }
  },
  cache: detector.cache,
  cacheUserLanguage: detector.cacheUserLanguage
};

export default enhancedDetector;
