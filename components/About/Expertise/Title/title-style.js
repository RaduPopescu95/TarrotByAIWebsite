import { makeStyles } from "tss-react/mui";

const titleBase = {
  textTransform: "capitalize",
  fontWight: 700,
  marginBottom: 40,
  position: "relative",
};

const titleStyles = makeStyles({ uniqId: "title" })((theme) => ({
  titlePrimary: {
    ...titleBase,
    color:
      theme.palette.mode === "dark"
        ? theme.palette.primary.light
        : theme.palette.primary.dark,
    fontSize: 48,
    lineHeight: "62px",
    [theme.breakpoints.down("lg")]: {
      fontSize: 38,
      lineHeight: "50px",
    },
    [theme.breakpoints.down("md")]: {
      textAlign: "center",
      marginBottom: theme.spacing(4),
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: 32,
      lineHeight: "42px",
    },
  },
  titleSecondary: {
    ...titleBase,
    color:
      theme.palette.mode === "dark"
        ? theme.palette.secondary.light
        : theme.palette.secondary.dark,
    fontSize: 48,
    lineHeight: "62px",
    [theme.breakpoints.down("lg")]: {
      fontSize: 38,
      lineHeight: "50px",
    },
    [theme.breakpoints.down("md")]: {
      textAlign: "center",
      marginBottom: theme.spacing(4),
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: 32,
      lineHeight: "42px",
    },
  },
  deco: {
    position: "relative",
    "& h3": {
      color: "white",
      width: 120,
      position: "relative",
      textTransform: "capitalize",
      paddingLeft: 20,
      fontSize: 48,
      fontWeight: 700,
      lineHeight: "62px",
      [theme.breakpoints.up("lg")]: {
        height: 160,
        marginLeft: theme.spacing(3),
      },
      [theme.breakpoints.up("md")]: {
        paddingTop: 40,
        marginTop: theme.spacing(10),
      },
      [theme.breakpoints.only("md")]: {
        marginLeft: theme.spacing(7),
      },
      [theme.breakpoints.down("lg")]: {
        fontSize: 38,
        lineHeight: "50px",
      },
      [theme.breakpoints.down("md")]: {
        paddingLeft: 0,
        color:
          theme.palette.mode === "dark"
            ? theme.palette.primary.light
            : theme.palette.primary.dark,
        width: "auto",
        textAlign: "center",
      },
      [theme.breakpoints.down("sm")]: {
        fontSize: 32,
        lineHeight: "42px",
      },
    },
    "&:before": {
      content: '""',
      width: 210,
      height: 210,
      background: "black",
      borderRadius: 24,
      transform: "rotate(45deg)",
      position: "absolute",
      top: 0,
      left: 0,
      [theme.breakpoints.down("lg")]: {
        left: theme.spacing(3),
      },
      [theme.breakpoints.down("md")]: {
        display: "none",
      },
    },
  },
}));

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default titleStyles;
