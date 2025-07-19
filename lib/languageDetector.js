import languageDetector from "next-language-detector";
import i18nextConfig from "../next-i18next.config";

// Safe logging that works in all environments
const safeLog = (level, message, data) => {
  if (typeof console !== 'undefined' && console[level]) {
    console[level](message, data);
  }
};

safeLog('log', '🔧 [INIT] languageDetector.js loaded:', {
  defaultLocale: i18nextConfig.i18n.defaultLocale,
  supportedLngs: i18nextConfig.i18n.locales,
  env: process.env.NODE_ENV,
  isServer: typeof window === 'undefined',
  isVercel: process.env.VERCEL === '1'
});

// Create detector with safe configuration
let detector;
try {
  detector = languageDetector({
    fallbackLng: i18nextConfig.i18n.defaultLocale,
    supportedLngs: i18nextConfig.i18n.locales,
    // Disable cookie detection on server for Vercel compatibility
    order: typeof window === 'undefined' 
      ? ['header', 'querystring'] 
      : ['localStorage', 'cookie', 'sessionStorage', 'navigator', 'htmlTag'],
    // Cache only on client side
    caches: typeof window === 'undefined' ? [] : ['localStorage', 'cookie'],
    // Safe fallback for Vercel edge functions
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,
  });
} catch (error) {
  safeLog('error', '❌ [DETECTOR] Failed to create detector:', error);
  // Create minimal fallback detector
  detector = {
    detect: () => i18nextConfig.i18n.defaultLocale,
    cache: () => {},
    cacheUserLanguage: () => {}
  };
}

// Enhanced detector with better error handling and Vercel compatibility
const enhancedDetector = {
  detect: (...args) => {
    try {
      let detected;
      
      // Special handling for Vercel environment
      if (process.env.VERCEL === '1' && typeof window === 'undefined') {
        // On Vercel server, prioritize header-based detection
        const acceptLanguage = args[0]?.headers?.['accept-language'];
        if (acceptLanguage) {
          const primaryLang = acceptLanguage.split(',')[0].split('-')[0];
          if (i18nextConfig.i18n.locales.includes(primaryLang)) {
            detected = primaryLang;
          }
        }
      }
      
      // Fallback to detector if no special case handled
      if (!detected) {
        detected = detector.detect(...args);
      }
      
      // Ensure detected language is supported
      if (!i18nextConfig.i18n.locales.includes(detected)) {
        detected = i18nextConfig.i18n.defaultLocale;
      }
      
      safeLog('log', '🎯 [DETECTOR] Language detected:', {
        detected,
        fallback: i18nextConfig.i18n.defaultLocale,
        supportedLngs: i18nextConfig.i18n.locales,
        isClient: typeof window !== 'undefined',
        isVercel: process.env.VERCEL === '1',
        browserLang: typeof window !== 'undefined' ? window.navigator.language : 'SSR',
        args
      });
      
      return detected;
    } catch (error) {
      safeLog('error', '❌ [DETECTOR] Detection failed:', error);
      return i18nextConfig.i18n.defaultLocale;
    }
  },
  
  cache: (...args) => {
    // Only cache on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    try {
      safeLog('log', '💾 [DETECTOR] Caching language:', args);
      return detector.cache(...args);
    } catch (error) {
      safeLog('error', '❌ [DETECTOR] Cache failed:', error);
    }
  },
  
  cacheUserLanguage: (...args) => {
    // Only cache on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    
    try {
      safeLog('log', '👤 [DETECTOR] Caching user language:', args);
      return detector.cacheUserLanguage(...args);
    } catch (error) {
      safeLog('error', '❌ [DETECTOR] User language cache failed:', error);
    }
  }
};

export default enhancedDetector;
