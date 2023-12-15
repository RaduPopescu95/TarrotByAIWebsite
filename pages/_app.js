import React, { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import "./globals.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import CssBaseline from "@mui/material/CssBaseline";

import appTheme from "../theme/appTheme";

/* CSS Imports */
import "react-18-image-lightbox/style.css";
import "../vendors/animate.css";
import "../vendors/animate-slider.css";
import "../vendors/hamburger-menu.css";
import "../vendors/animate-extends.css";
import dynamic from "next/dynamic";

import Script from "next/script";

// Create your theme outside of the component to avoid re-creation on re-renders
const defaultTheme = createTheme(appTheme("mainTheme", "light"));

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Function to handle sending page view events to Google Analytics
    const handleRouteChange = (url) => {
      window.gtag("config", "G-L7VLTWWMW7", {
        page_path: url,
      });
    };

    // Subscribe to route changes
    router.events.on("routeChangeComplete", handleRouteChange);

    // Remove the preloader once the app is hydrated
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.display = "none";
    }

    // Unsubscribe from route changes on cleanup
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      {/* Google Analytics Scripts */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-L7VLTWWMW7"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L7VLTWWMW7');
        `}
      </Script>

      <CacheProvider value={createCache({ key: "css" })}>
        <ThemeProvider theme={defaultTheme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </CacheProvider>
    </>
  );
}

export default MyApp;
