import { AuthProvider } from "../context/AuthContext";
import ApiDataProvider from "../context/ApiContext";
import { NumberProvider } from "../context/NumberContext";
import { appWithTranslation } from "next-i18next";
import "./globals.css";
import { DatabaseProvider } from "../context/DatabaseContext";

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

function MyApp({ Component, pageProps }) {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <ApiDataProvider>
          <NumberProvider>
            <Component {...pageProps} />
          </NumberProvider>
        </ApiDataProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}

export default appWithTranslation(MyApp);
