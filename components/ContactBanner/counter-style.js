import { makeStyles } from "tss-react/mui";

const counterStyles = makeStyles({ uniqId: "counter" })(
  (theme, _params, classes) => ({
    buttonHeader: {
      marginTop: 28,
      fontSize: "15px",
      fontWeight: "700",
      backgroundColor: "#d3a03e",
      color: "white",
      width: "170px",
      textTransform: "none",
      border: "1px solid transparent",
      transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
      "&:hover": {
        backgroundColor: "transparent", // Culorea de fundal pentru hover
        border: "1px solid #d3a03e", // Adaugă o bordură la hover
      },
    },

    text: {},
    counterItem: {
      [theme.breakpoints.up("xs")]: {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexDirection: "column",
      },
      [theme.breakpoints.up("sm")]: {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexDirection: "column",
      },
      [theme.breakpoints.up("md")]: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      },
    },
    dark: {
      background: theme.palette.primary.main,
      [`& .${classes.counterItem}`]: {
        color: theme.palette.common.white,
        "& svg": {
          fill: theme.palette.common.white,
        },
      },
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default counterStyles;
