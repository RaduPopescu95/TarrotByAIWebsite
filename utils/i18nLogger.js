// Utility pentru debugging i18n în componente
// Set DISABLE_I18N_LOGS=true în environment pentru a opri log-urile
export const logI18nStatus = (componentName, { t, i18n, router, additionalInfo = {} }) => {
  if (process.env.DISABLE_I18N_LOGS === 'true') return;
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV && !process.env.ENABLE_I18N_LOGS) return;

  const status = {
    component: componentName,
    timestamp: new Date().toISOString(),
    
    // Router info
    routerLocale: router?.locale,
    routerReady: router?.isReady,
    routerAsPath: router?.asPath,
    
    // i18n info
    i18nLanguage: i18n?.language,
    i18nIsInitialized: i18n?.isInitialized,
    i18nNamespaces: i18n?.options?.ns,
    
    // Translation function
    hasT: !!t && typeof t === 'function',
    tType: typeof t,
    
    // Test translations
    testHello: t ? t('hello', 'MISSING_HELLO') : 'NO_T_FUNCTION',
    testServices: t ? t('Services', 'MISSING_SERVICES') : 'NO_T_FUNCTION',
    
    // Browser/storage
    isClient: typeof window !== 'undefined',
    localStorage: typeof window !== 'undefined' ? localStorage.getItem('locale') : 'SSR',
    browserLang: typeof window !== 'undefined' ? window.navigator.language : 'SSR',
    
    // Environment
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    
    // Additional info from component
    ...additionalInfo
  };

  console.log(`🔍 [i18n-DEBUG] ${componentName}:`, status);
  
  return status;
};

// Function to test specific translations
export const testTranslations = (t, keys = ['hello', 'Services', 'exploreServices', 'myServices']) => {
  const results = {};
  
  keys.forEach(key => {
    try {
      const result = t ? t(key, `MISSING_${key}`) : `NO_T_FUNCTION_${key}`;
      results[key] = result;
      console.log(`🔤 [TRANSLATION-TEST] ${key}:`, result);
    } catch (error) {
      results[key] = `ERROR: ${error.message}`;
      console.error(`❌ [TRANSLATION-TEST] ${key} failed:`, error);
    }
  });
  
  return results;
};

// Environment info logger
export const logEnvironmentInfo = () => {
  console.log('🌍 [ENV-INFO] Environment details:', {
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    isClient: typeof window !== 'undefined',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    timestamp: new Date().toISOString()
  });
}; 