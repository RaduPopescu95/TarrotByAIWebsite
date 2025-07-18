import { AuthProvider } from "../context/AuthContext";
import ApiDataProvider from "../context/ApiContext";
import { NumberProvider } from "../context/NumberContext";
import { appWithTranslation } from "next-i18next";
import "./globals.css";
import { DatabaseProvider } from "../context/DatabaseContext";
import LanguageSelectionDialog from "../components/LanguageSelectionDialog";
import useFirstVisit from "../hooks/useFirstVisit";

// Import Bootstrap CSS first (complete Bootstrap with grid, cards, breadcrumbs, etc.)
require("bootstrap/dist/css/bootstrap.min.css");

// Import FontAwesome CSS
require("../client/assets/icons/fontawesome/css/fontawesome.min.css");
require("../client/assets/icons/fontawesome/css/all.min.css");

// Import main SCSS (this includes header, navbar, and all base styles)
require("../client/assets/scss/main.scss");

// Import unified design CSS
require("../styles/unified-design.css");

// Import consultations page CSS
require("../styles/consultations.css");

// Import component-specific CSS for hydration fixes
require("../styles/landing-animations.css");
require("../styles/headline.css");
require("../styles/headline-consultatii.css");
require("../styles/post-card.css");
require("../styles/modern-components.css");
require("../styles/modern-blog.css");
require("../styles/tailwind-blog.css");
require("../styles/main-dashboard.css");

// Componentă wrapper pentru gestionarea dialogului de selecție a limbii
function AppWithLanguageDialog({ Component, pageProps }) {
  const { showLanguageDialog, isLoading, closeLanguageDialog, resetFirstVisit } = useFirstVisit();

  // Expune funcția resetFirstVisit global pentru debugging/testing
  if (typeof window !== 'undefined') {
    window.resetLanguageSelection = resetFirstVisit;
  }

  return (
    <>
      <Component {...pageProps} />
      
      {/* Dialog de selecție a limbii pentru prima vizită */}
      <LanguageSelectionDialog 
        isOpen={showLanguageDialog} 
        onClose={closeLanguageDialog} 
      />
      
      {/* Loading overlay subtil în timpul verificării primei vizite */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <ApiDataProvider>
          <NumberProvider>
            <AppWithLanguageDialog Component={Component} pageProps={pageProps} />
          </NumberProvider>
        </ApiDataProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}

export default appWithTranslation(MyApp);
