import { makeStyles } from "tss-react/mui";

const featureStyles = makeStyles({ uniqId: "feature" })(
  (theme, _params, classes) => ({
    root: {
      position: "relative",
      backgroundColor: "black",
    },
    decoration: {
      position: "absolute",
      width: 1280,
      height: "100%",
      left: -10,
      top: 180,
      "& svg": {
        width: "100%",
        height: 1700,
        fill:
          theme.palette.mode === "dark"
            ? theme.palette.primary.dark
            : theme.palette.primary.light,
        opacity: 0.2,
        transform: "scale(1.3)",
        [theme.breakpoints.up(1400)]: {
          transform: "scale(2.5, 1)",
        },
        [theme.breakpoints.up("xl")]: {
          display: "none",
        },
        [theme.breakpoints.down("sm")]: {
          transform: "scale(0.5)",
          transformOrigin: "center left",
        },
      },
    },
    buttonHeader: {
      marginTop: 25.6,
      fontSize: "15px",
      fontWeight: "700",
      backgroundColor: "#d3a03e",
      color: "white",
      width: "170px",
      textTransform: "none",
      border: "1px solid transparent",
      boxShadow: "none", // Elimină umbra
      transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
      "&:hover": {
        backgroundColor: "transparent", // Culorea de fundal pentru hover
        border: "1px solid #d3a03e", // Adaugă o bordură la hover
        boxShadow: "none", // Elimină umbra la hover
      },
    },

    figure: {
      margin: 0,
    },
    last: {},
    desc: {
      position: "relative",
      zIndex: 60,
    },
    item: {
      position: "relative",
      minHeight: 320,

      "& h6": {
        marginBottom: theme.spacing(4),
      },
      [`& .${classes.figure}`]: {
        "& img": {
          width: "100%",
        },
      },
    },
    graphic: {
      position: "relative",
      "& img": {
        width: "90%",
        display: "block",
      },
    },
    illustrationLeft: {
      position: "relative",
      zIndex: 1,
      maxHeight: 600,
      height: "100%",
    },
    illustrationRight: {
      position: "relative",
      zIndex: 1,
      maxHeight: 600,
      height: "100%",
    },
    illustrationCenter: {
      perspective: 1000,
      [`& .${classes.graphic}`]: {
        display: "block",
        textAlign: "center",
        maxWidth: 700,
        margin: "0 auto",
        "& img": {
          margin: "0 auto",
          width: "100%",
        },
      },
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default featureStyles;
