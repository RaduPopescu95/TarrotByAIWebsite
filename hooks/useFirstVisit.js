import { useState, useEffect } from 'react';

/**
 * Hook pentru detectarea primei vizite și gestionarea dialogului de selecție a limbii
 */
export const useFirstVisit = () => {
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifică dacă suntem în browser
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Introduce o mică întârziere pentru a permite încărcarea completă
    const timeoutId = setTimeout(() => {
      try {
        // Verifică dacă utilizatorul a selectat deja limba
        const hasSelectedLanguage = localStorage.getItem('languageSelected');
        const lastVisit = localStorage.getItem('lastVisit');
        const currentTime = Date.now();
        
        // Consideră prima vizită dacă:
        // 1. Nu a selectat niciodată limba SAU
        // 2. Ultima vizită a fost acum mai mult de 30 de zile (pentru resetare)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const shouldShowDialog = !hasSelectedLanguage || 
                                (lastVisit && (currentTime - parseInt(lastVisit)) > thirtyDaysInMs);

        console.log('🌍 [FIRST VISIT] Check results:', {
          hasSelectedLanguage: !!hasSelectedLanguage,
          lastVisit: lastVisit ? new Date(parseInt(lastVisit)).toLocaleDateString() : 'never',
          shouldShowDialog,
          currentTime: new Date(currentTime).toLocaleDateString()
        });

        if (shouldShowDialog) {
          setIsFirstVisit(true);
          setShowLanguageDialog(true);
          
          // Marchează vizita curentă
          localStorage.setItem('lastVisit', currentTime.toString());
          
          console.log('🌍 [FIRST VISIT] Showing language dialog for first-time or returning user');
        } else {
          console.log('🌍 [FIRST VISIT] User has already selected language, skipping dialog');
        }
        
      } catch (error) {
        console.error('🌍 [FIRST VISIT] Error checking visit status:', error);
        // În caz de eroare, nu afișa dialogul
      } finally {
        setIsLoading(false);
      }
    }, 500); // Mică întârziere pentru UX mai bun

    return () => clearTimeout(timeoutId);
  }, []);

  const handleCloseLanguageDialog = () => {
    setShowLanguageDialog(false);
    setIsFirstVisit(false);
    
    // Marchează că dialogul a fost închis
    const currentTime = Date.now();
    localStorage.setItem('lastVisit', currentTime.toString());
    
    console.log('🌍 [FIRST VISIT] Language dialog closed');
  };

  const resetFirstVisit = () => {
    // Funcție pentru resetarea stării (utilă pentru testing sau admin)
    localStorage.removeItem('languageSelected');
    localStorage.removeItem('selectedLanguage');
    localStorage.removeItem('lastVisit');
    setIsFirstVisit(true);
    setShowLanguageDialog(true);
    
    console.log('🌍 [FIRST VISIT] Visit status reset - dialog will show again');
  };

  return {
    showLanguageDialog,
    isFirstVisit,
    isLoading,
    closeLanguageDialog: handleCloseLanguageDialog,
    resetFirstVisit
  };
};

export default useFirstVisit; 