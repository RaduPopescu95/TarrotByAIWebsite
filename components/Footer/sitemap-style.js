import { makeStyles } from "tss-react/mui";

const footerStyles = makeStyles({ uniqId: "sitemap" })(
  (theme, _params, classes) => ({
    navLinkMixed: {
      textDecoration: "none",
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      marginRight: 30,
      position: "relative",
      "&:after": {
        content: '""',
        display: "block",
        width: "0px",
        height: "1.5px",
        background: "white", // Modificăm culoarea border-ului aici
        transition: "width .4s",
        position: "absolute",
        bottom: 0,
        left: 0,
      },
      "&:hover:after": {
        width: "100%",
        left: 0,
        right: 0,
        color: "white",
      },
      "&:hover": {
        color: "white",
      },
    },
    link: {
      margin: theme.spacing(1, 1.5),
    },
    footer: {
      backgroundColor: "#252525",
      paddingLeft: 20,
      paddingRight: 20,
      position: "relative",
      paddingTop: 20,
      [theme.breakpoints.up("sm")]: {
        paddingBottom: theme.spacing(8),
      },
      "& ul": {
        margin: 0,
        padding: 0,
      },
      "& li": {
        listStyle: "none",
        marginBottom: theme.spacing(),
        "& a": {
          fontSize: 14,
          textDecoration: "none !important",
          "&:hover": {
            color: theme.palette.primary.main,
          },
        },
      },
      "& p": {
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(0, 3),
          textAlign: "center",
        },
      },
    },
    title: {
      color: "white",
      fontSize: 14,
      textTransform: "uppercase",

      fontWeight: theme.typography.fontWeightBold,
      [theme.breakpoints.up("xs")]: {
        marginTop: 20,
        marginBottom: 8,
      },
      [theme.breakpoints.up("sm")]: {
        marginTop: 10,
        marginBottom: 8,
      },
      [theme.breakpoints.up("md")]: {
        marginTop: 0,
        marginBottom: theme.spacing(3),
      },
    },
    logo: {
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      marginBottom: theme.spacing(3),
      "& img": {
        filter: "grayscale(1) contrast(0.5) brightness(1.5)",
        width: 48,
        marginRight: theme.spacing(),
      },
      "& h6": {
        color: theme.palette.text.disabled,
      },
      [theme.breakpoints.down("sm")]: {
        justifyContent: "center",
        padding: theme.spacing(0, 3),
      },
    },
    footerDesc: {
      display: "block",

      fontSize: 14,
      marginBottom: 20,
      color: "white",
    },
    socmed: {
      display: "flex",
      justifyContent: "flex-start",
      // marginBottom: theme.spacing(4),
      "& button": {
        margin: theme.spacing(),
        color:
          theme.palette.mode === "dark"
            ? theme.palette.primary.light
            : theme.palette.primary.dark,
        background: theme.palette.divider,
        width: 36,
        height: 36,
        lineHeight: "36px",
        "& i": {
          color:
            theme.palette.mode === "dark"
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
        },
      },
      "& svg": {
        width: 24,
        height: 24,
      },
    },
    icon: {
      "& + div": {
        background: "none !important",
        padding: theme.spacing(1.5, 1.5, 1.5, 4),
        width: "calc(100% - 32px)",
      },
    },
    selectLang: {
      margin: "0 auto",
      width: 200,
      display: "inherit",
      marginTop: theme.spacing(2),
      color:
        theme.palette.mode === "dark"
          ? theme.palette.primary.light
          : theme.palette.primary.dark,
      [`& .${classes.icon}`]: {
        top: 21,
        position: "relative",
      },
      "& fieldset": {
        boxShadow: "0 1.5px 12px 2px rgba(0, 0, 0, 0.06)",
        border: `1px solid ${
          theme.palette.mode === "dark"
            ? theme.palette.primary.light
            : theme.palette.primary.main
        } !important`,
        "& legend": {
          top: 5,
          position: "relative",
          borderTop: `1px solid ${
            theme.palette.mode === "dark"
              ? theme.palette.primary.light
              : theme.palette.primary.main
          }`,
        },
      },
    },
    siteMapItem: {
      [theme.breakpoints.down("sm")]: {
        paddingBottom: "0 !important",
        paddingTop: "0 !important",
      },
    },
    accordionRoot: {
      background: "none",
      boxShadow: "none",
      maxWidth: 480,
      margin: "0 auto",
      marginTop: theme.spacing(2),
    },
    accordionContent: {
      margin: 0,
    },
    accordionIcon: {
      padding: 0,
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default footerStyles;
