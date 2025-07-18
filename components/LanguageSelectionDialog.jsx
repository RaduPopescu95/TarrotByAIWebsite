import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const LanguageSelectionDialog = ({ isOpen, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('ro');
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Language mapping cu aceleași flag-uri ca în navbar
  const languages = {
    en: { name: "English", flag: "/flags/english.png", nativeName: "English" },
    ro: { name: "Română", flag: "/flags/romania.png", nativeName: "Română" },
    bg: { name: "Български", flag: "/flags/bulgaria.png", nativeName: "Български" },
    hr: { name: "Hrvatski", flag: "/flags/croatia.png", nativeName: "Hrvatski" },
    cs: { name: "Čeština", flag: "/flags/czech.png", nativeName: "Čeština" },
    fr: { name: "Français", flag: "/flags/france.png", nativeName: "Français" },
    de: { name: "Deutsch", flag: "/flags/germany.png", nativeName: "Deutsch" },
    el: { name: "Ελληνικά", flag: "/flags/greece.png", nativeName: "Ελληνικά" },
    hi: { name: "हिंदी", flag: "/flags/india.png", nativeName: "हिंदी" },
    id: { name: "Bahasa Indonesia", flag: "/flags/indonesia.png", nativeName: "Bahasa Indonesia" },
    it: { name: "Italiano", flag: "/flags/italy.png", nativeName: "Italiano" },
    pl: { name: "Polski", flag: "/flags/poland.png", nativeName: "Polski" },
    sk: { name: "Slovenčina", flag: "/flags/slovakia.png", nativeName: "Slovenčina" },
    es: { name: "Español", flag: "/flags/spanish.png", nativeName: "Español" },
  };

  // Detectează limba curentă la încărcare
  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(router.locale || 'ro');
      // Animație de intrare
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, router.locale]);

  const handleLanguageSelect = (locale) => {
    setSelectedLanguage(locale);
  };

  const handleConfirm = () => {
    // Marchează că utilizatorul a selectat limba
    localStorage.setItem('languageSelected', 'true');
    localStorage.setItem('selectedLanguage', selectedLanguage);
    
    // Schimbă limba și închide dialogul
    router.push(router.asPath, router.asPath, { locale: selectedLanguage }).then(() => {
      onClose();
    });
  };

  const handleSkip = () => {
    // Marchează că utilizatorul a sărit peste selecție
    localStorage.setItem('languageSelected', 'true');
    localStorage.setItem('selectedLanguage', router.locale || 'ro');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      ...styles.overlay,
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' : 'hidden'
    }}>
      <div style={{
        ...styles.dialog,
        transform: isVisible ? 'scale(1)' : 'scale(0.9)'
      }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <div style={styles.globeIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
          </div>
          <h2 style={styles.title}>Alege limba preferată</h2>
          <p style={styles.subtitle}>
            Selectează limba în care dorești să navighezi pe site-ul nostru
          </p>
        </div>

        {/* Language Grid */}
        <div style={styles.languageGrid}>
          {Object.entries(languages).map(([locale, lang]) => (
            <button
              key={locale}
              onClick={() => handleLanguageSelect(locale)}
              style={{
                ...styles.languageCard,
                ...(selectedLanguage === locale && styles.languageCardSelected)
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage !== locale) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage !== locale) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              <img 
                src={lang.flag} 
                alt={lang.name}
                style={styles.flagImage}
              />
              <span style={styles.languageName}>{lang.nativeName}</span>
              {selectedLanguage === locale && (
                <div style={styles.checkmark}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button
            onClick={handleSkip}
            style={styles.skipButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Păstrează româna
          </button>
          <button
            onClick={handleConfirm}
            style={styles.confirmButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            <span>Confirmă alegerea</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px' }}>
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12,5 19,12 12,19"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  dialog: {
    position: 'relative',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '30px',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  globeIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: 'white',
  },
  subtitle: {
    fontSize: '16px',
    margin: 0,
    opacity: 0.9,
    color: 'white',
    lineHeight: '1.5',
  },
  languageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    padding: '30px',
    flex: '1',
    minHeight: '200px',
    maxHeight: '350px',
    overflowY: 'auto',
  },
  languageCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  languageCardSelected: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)',
  },
  flagImage: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  languageName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  checkmark: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    backgroundColor: '#667eea',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
    marginTop: 'auto',
  },
  skipButton: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  confirmButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  },
};

export default LanguageSelectionDialog; 