import { makeStyles } from "tss-react/mui";

const sliderStyle = makeStyles({ uniqId: "slider" })(
  (theme, _params, classes) => ({
    bannerWrap: {
      position: "relative",
      display: "block",
    },
    slide: {
      position: "relative",
      [theme.breakpoints.up("sm")]: {
        height: 450,
      },
      [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(15, 0, 5),
      },
    },
    imageHeader: {
      width: "100%",
      height: "auto",
      position: "relative",
      right: 200,

      [theme.breakpoints.up("xs")]: {
        right: 0,
        // bottom: 70,
      },
      [theme.breakpoints.up("sm")]: {
        right: 0,
        bottom: 0,
      },
      [theme.breakpoints.up("md")]: {
        right: 100,
      },
      [theme.breakpoints.up("lg")]: {
        right: 200,
      },
    },
    img: {
      right: "1%",
      maxWidth: "40%",
      "& img": {
        width: "100%",
        // height: "auto",
      },
      [theme.breakpoints.up("sm")]: {
        backgroundColor: "red",
        position: "absolute",
        top: 100,
      },
      [theme.breakpoints.up("md")]: {
        backgroundColor: "blue",
        right: theme.direction === "ltr" ? "10%" : "auto",
        left: theme.direction === "ltr" ? "auto" : "10%",
        maxWidth: "100%",
      },
      [theme.breakpoints.down("sm")]: {
        backgroundColor: "green",
        margin: theme.spacing(4, 0),
        width: "100%",
      },
    },
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
    inner: {
      display: "flex",
      height: "100%",
      alignItems: "center",
      [theme.breakpoints.down("lg")]: {
        flexDirection: "column",
        justifyContent: "center",
      },
    },
    text: {
      "& h3": {
        fontWeight: theme.typography.fontWeightBold,
      },
      "& h5": {
        color: theme.palette.text.secondary,
      },
    },
    slideNav: {
      display: "flex",
    },
    active: {},
    btnNav: {
      textTransform: "none",
      height: "auto",
      padding: theme.spacing(1),
      flex: 1,
      fontWeight: theme.typography.fontWeightRegular,
      flexDirection: "column",
      alignItems: "flex-start",
      textAlign: "left",
      "& strong": {
        textTransform: "capitalize",
        fontSize: 28,
        display: "block",
        fontWeight: theme.typography.fontWeightBold,
      },
      [`&.${classes.active}`]: {
        color: theme.palette.primary.main,
      },
    },
    divider: {
      margin: theme.spacing(0, 2),
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default sliderStyle;
