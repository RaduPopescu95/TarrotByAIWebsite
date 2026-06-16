import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import i18nextConfig from '../next-i18next.config';
import { getLocaleAbbreviation, getLocaleNativeLabel } from '../lib/localeFlags';

// Helper function to set language cookie for next-i18next
const setLanguageCookie = (locale) => {
  // Set the NEXT_LOCALE cookie that next-i18next uses
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
  
  // Also set a backup cookie
  document.cookie = `next-i18next=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const LanguageSelectionDialog = ({ isOpen, onClose, onLanguageSelect }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const languages = useMemo(
    () =>
      i18nextConfig.i18n.locales.map((code) => ({
        code,
        name: getLocaleNativeLabel(code),
        abbreviation: getLocaleAbbreviation(code),
      })),
    []
  );
  const [selectedLanguage, setSelectedLanguage] = useState(() => router.locale || i18n.language || 'ro');

  useEffect(() => {
    if (router.locale) setSelectedLanguage(router.locale);
  }, [router.locale]);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
  };

  const handleConfirm = () => {
    console.log('🌍 Language selection confirmed:', selectedLanguage);
    
    // Set cookies for next-i18next (critical for Vercel production)
    setLanguageCookie(selectedLanguage);
    
    // Marchează că utilizatorul a selectat limba
    localStorage.setItem('languageSelected', 'true');
    localStorage.setItem('selectedLanguage', selectedLanguage);
    
    // For production (Vercel), use window.location.href for full reload
    // This ensures that the language change takes effect immediately
    if (process.env.NODE_ENV === 'production') {
      const currentPath = router.asPath;
      const newUrl = `/${selectedLanguage}${currentPath}`;
      window.location.href = newUrl;
    } else {
      // For development, use router.push
      const { pathname, query } = router;
      router.push({ pathname, query }, router.asPath, { locale: selectedLanguage }).then(() => {
        onLanguageSelect(selectedLanguage);
        onClose();
      });
    }
  };

  const handleSkip = () => {
    const currentLocale = router.locale || 'ro';
    
    console.log('🌍 Language selection skipped, keeping:', currentLocale);
    
    // Set cookie for consistency
    setLanguageCookie(currentLocale);
    
    // Marchează că utilizatorul a sărit peste selecție
    localStorage.setItem('languageSelected', 'true');
    localStorage.setItem('selectedLanguage', currentLocale);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={{
          animation: 'slideIn 0.3s ease-out',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div 
          className="px-8 py-6 text-center relative"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-center mb-2">
            <svg 
              className="w-8 h-8 mr-3" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h2 className="text-2xl font-bold">Welcome! 🌍</h2>
          </div>
          <p className="text-lg opacity-90">Choose your preferred language</p>
        </div>

        {/* Content */}
        <div className="p-8" style={{ flex: '1', minHeight: '200px', maxHeight: '520px', overflowY: 'auto' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 
                  hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${selectedLanguage === lang.code 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                style={{
                  transform: selectedLanguage === lang.code ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {selectedLanguage === lang.code && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-gray-600 mb-2 tracking-wide">
                    {lang.abbreviation}
                  </span>
                  <span className="text-sm font-medium text-gray-700 text-center leading-tight">
                    {lang.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleConfirm}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-initial"
          >
            Continue with {languages.find(l => l.code === selectedLanguage)?.name}
          </button>
          
          <button
            onClick={handleSkip}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 flex-1 sm:flex-initial"
          >
            Skip for now
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelectionDialog; 