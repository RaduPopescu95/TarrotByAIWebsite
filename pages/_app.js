import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import appTheme from "../theme/appTheme";
import { AuthProvider } from "../context/AuthContext";
import ApiDataProvider from "../context/ApiContext";

const defaultTheme = createTheme(appTheme("mainTheme", "light"));

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ApiDataProvider>
        <CacheProvider value={createCache({ key: "css" })}>
          <ThemeProvider theme={defaultTheme}>
            <CssBaseline />
            <Component {...pageProps} />
          </ThemeProvider>
        </CacheProvider>
      </ApiDataProvider>
    </AuthProvider>
  );
}

export default MyApp;
