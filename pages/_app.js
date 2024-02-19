import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import appTheme from "../theme/appTheme";
import { AuthProvider } from "../context/AuthContext";
import ApiDataProvider from "../context/ApiContext";
import { NumberProvider } from "../context/NumberContext";
import { appWithTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import "./globals.css";

const defaultTheme = createTheme(appTheme("mainTheme", "light"));

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ApiDataProvider>
        <NumberProvider>
          <CacheProvider value={createCache({ key: "css" })}>
            <ThemeProvider theme={defaultTheme}>
              <CssBaseline />
              <Component {...pageProps} />
            </ThemeProvider>
          </CacheProvider>
        </NumberProvider>
      </ApiDataProvider>
    </AuthProvider>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}

export default appWithTranslation(MyApp);
