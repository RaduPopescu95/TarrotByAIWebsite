import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import languageDetector from './languageDetector';

export const useLanguage = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');

  // Get current language with multiple fallbacks
  const getCurrentLanguage = () => {
    // 1. Try Next.js router locale (most reliable on Vercel)
    if (router.locale && router.locale !== 'default') {
      return router.locale;
    }

    // 2. Try i18n current language
    if (i18n.language && i18n.language !== 'cimode') {
      return i18n.language;
    }

    // 3. Try our enhanced language detector
    const detected = languageDetector.detect();
    if (detected) {
      return detected;
    }

    // 4. Final fallback
    return 'ro';
  };

  const currentLanguage = getCurrentLanguage();

  return {
    t,
    currentLanguage,
    detectedLng: currentLanguage, // Alias pentru compatibilitate
    router,
    i18n
  };
}; 