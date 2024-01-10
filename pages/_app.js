import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import appTheme from "../theme/appTheme";
import { AuthProvider } from "../context/AuthContext";

const defaultTheme = createTheme(appTheme("mainTheme", "light"));

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CacheProvider value={createCache({ key: "css" })}>
        <ThemeProvider theme={defaultTheme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </CacheProvider>
    </AuthProvider>
  );
}

export default MyApp;
