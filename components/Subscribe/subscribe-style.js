import { makeStyles } from "tss-react/mui";

const subscribeStyles = makeStyles({ uniqId: "subscribe" })((theme) => ({
  subscribeWrap: {
    maxWidth: 600,
    margin: theme.spacing(0, 2),

    [theme.breakpoints.up("sm")]: {
      margin: "0 auto 32px",
    },
    zIndex: 9,
    position: "relative",
  },
  buttonHeader: {
    fontSize: "15px",
    fontWeight: "700",
    backgroundColor: "transparent",
    color: "white",
    width: "170px",
    textTransform: "none",
    border: "1px solid #d3a03e",
    transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
    "&:hover": {
      backgroundColor: "#d3a03e", // Culorea de fundal pentru hover
      border: "1px solid #d3a03e", // Adaugă o bordură la hover
    },
  },
  paper: {
    padding: theme.spacing(4),
  },
  textField: {
    marginBottom: theme.spacing(3),
  },
  rightIcon: {
    marginLeft: theme.spacing(),
    transform: theme.direction === "rtl" ? "scale(-1)" : "inherit",
  },
}));

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default subscribeStyles;
