import { createTheme } from "@mui/material/styles";

const appTheme = createTheme({
  palette: {
    primary: {
      main: "#04385A",
      light: "#FFFFFF",
    },
    secondary: {
      main: "rgba(44, 207, 188, 1)",
      contrastText: "#fff",
    },
    success: {
      main: "#2CCFBC",
    },
    common: {
      black: "#000",
      white: "rgba(49, 46, 67, 0.32)",
    },
    grey: {
      500: "rgba(49, 46, 67, 0.32)",
      600: "rgba(224, 224, 224, 1)",
      700: "#F6F8FA",
    },
    warning: {
      main: "#F93E6C",
      light: "rgba(249, 62, 108, 1)",
    },
    text: {
      primary: "#464356",
    },
  },
  typography: {
    fontFamily: "'inter','sans-serif'.",
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h3: {
      fontFamily: "'inter','sans-serif'.",
      color: "#464356",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'inter','sans-serif'.",
      fontWeight: 700,
    },
    h5: {
      fontFamily: "'inter','sans-serif'.",
      fontWeight: 700,
    },
    h6: {
      fontFamily: "'inter','sans-serif'.",
      fontWeight: 700,
    },
    body1: {
      fontFamily: "'inter','sans-serif'.",
      fontWeight: 400,
      fontSize: "14px",
    },
    body2: {
      fontFamily: "'inter','sans-serif'.",
      fontWeight: 600,
      fontSize: "14px",
    },
    subtitle1: {
      fontFamily: "'inter','sans-serif'.",
      fontWeight: 600,
      fontSize: "14px",
    },
  },
});

export default appTheme;
