import { makeStyles } from "tss-react/mui";

const flagIcon = {
  width: 16,
  height: 16,
  borderRadius: "50%",
  display: "inline-block",
  position: "relative",
  marginRight: 5,
  top: 1,

  backgroundSize: "16px auto",
  '&[class="ar"]': {
    backgroundPosition: "0 3px",
  },
  '&[class="zh"]': {
    backgroundPosition: "0 -12px",
  },
  '&[class="en"]': {
    backgroundPosition: "0 -28px",
  },
  '&[class="de"]': {
    backgroundPosition: "0 -44px",
  },
  '&[class="id"]': {
    backgroundPosition: "0 -62px",
  },
  '&[class="pt"]': {
    backgroundPosition: "0 -79px",
  },
};

const headerStyles = makeStyles({ uniqId: "header" })(
  (theme, _params, classes) => ({
    fixed: {},
    openDrawer: {},

    header: {
      position: "fixed",
      color: theme.palette.text.primary,
      background: "#252525",
      boxShadow: "none",
      transition: "all 0.3s ease",
      zIndex: 1000,
      [`&.${classes.fixed}`]: {
        background: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
        top: 0,
        left: 0,
        [`& .${classes.logo}`]: {
          "& img": {
            height: 40,
          },
        },
        "& nav": {
          padding: theme.spacing(1, 0),
        },
        [`& .${classes.vDivider}`]: {
          minHeight: theme.spacing(3),
        },
      },
      [`&.${classes.openDrawer}`]: {
        zIndex: 1600,
        boxShadow: "none",
      },
    },
    noShadow: {
      background: theme.palette.background.paper,
      boxShadow: "none !important",
    },
    navLinkMixed: {
      textDecoration: "none",
      color: "white",
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
      },
    },

    headerContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      "& nav": {
        transition: "all 0.3s ease",
        alignItems: "center",
        padding: theme.spacing(2, 1),
        [theme.breakpoints.down("lg")]: {
          padding: theme.spacing(1, 0),
        },
        display: "flex",
      },
    },
    settingMenu: {
      width: 240,
    },
    logo: {
      padding: "0px 0px 0 70px",
      "& a": {
        textDecoration: "none",
        display: "block",
      },
      "& img": {
        transition: "all 0.3s ease",
      },
    },
    active: {},
    navMenu: {
      padding: "0px 10px 0px 10px",
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      [theme.breakpoints.up("lg")]: {
        "& > *": {
          margin: theme.spacing(0, 1),
        },
      },
      "& ul li": {
        overflow: "visible",
      },
    },
    dropdownMenu: {
      transform: "scale(1)",
      backgroundClor: "transparent",
      transition: "transform 0.3s, background-color 0.3s",

      "&:hover": {
        transform: "scale(1.05)",
        backgroundColor: "#252525",
      },
    },
    mainMenu: {
      "& > ul": {
        listStyle: "none",
        position: "relative",
        padding: 0,
        margin: 0,
        "& > li": {
          display: "inline-block",
          position: "relative",
          margin: theme.spacing(0, 1),
          listStyle: "none",
          '&[class="active"]': {
            "&:after": {
              content: '""',
              position: "absolute",
              width: "100%",
              height: 4,
              background: theme.palette.primary.main,
              bottom: -14,
              left: 0,
            },
          },
          "& button, & a": {
            color: theme.palette.text.primary,
            background: "none",
            textTransform: "capitalize",
          },
        },
      },
    },
    userMenu: {
      padding: "0px 70px 0 0px",
      display: "flex",
      alignItems: "center",
      "& > div > a": {
        margin: theme.spacing(0, 1),
      },
    },
    langMenu: {},
    mobileMenu: {
      color: "white",
      marginRight: theme.spacing(1),
      padding: 0,
      [`& .${classes.bar}`]: {
        backgroundColor: theme.palette.text.light,
        "&:after, &:before": {
          backgroundColor: theme.palette.text.light,
        },
      },
    },
    vDivider: {
      margin: theme.spacing(0, 1, 0, 2),
      borderLeft: `1px solid ${theme.palette.divider}`,
      height: "100%",
      minHeight: theme.spacing(6),
    },
    icon: {},
    setting: {
      [`& .${classes.icon}`]: {
        transition: "all 0.3s ease",
      },
      [`& .${classes.active}`]: {
        transform: "rotate(30deg)",
      },
    },
    bar: { color: "white" },
    menu: {},
    megaMenuRoot: {
      width: "100%",
      zIndex: 100,
      left: "-5px !important",
    },
    multiMenuRoot: {
      minWidth: 200,
      zIndex: 100,
      "& ul": {
        padding: theme.spacing(1),
        "& li": {
          borderRadius: theme.rounded.small,
          minHeight: 48,
          padding: theme.spacing(1),
          "& svg": {
            fill: theme.palette.text.hint,
            transform: theme.direction === "rtl" ? "scale(-1)" : "inherit",
          },
        },
      },
    },
    megaMenu: {
      background: theme.palette.background.paper,
      padding: theme.spacing(4, 0),
      borderRadius: 0,
      maxHeight: 480,
      overflow: "auto",
    },
    thumbMenu: {
      width: 200,
      height: 78,
      borderRadius: theme.rounded.small,
      margin: theme.spacing(0, 1, 2),
    },
    titleMega: {
      textTransform: "uppercase",
      fontWeight: theme.typography.fontWeightBold + "!important",
      fontSize: "11px !important",
    },
    menuItem: {
      borderRadius: theme.rounded.small,
    },
    link: {
      padding: "0 !important",
      "&:hover": {
        backgroundColor: "transparent !important",
      },
    },
    current: {
      background:
        theme.palette.mode === "dark"
          ? theme.palette.primary.dark
          : theme.palette.primary.light,
      color:
        theme.palette.mode === "dark"
          ? theme.palette.primary.light
          : theme.palette.primary.dark,
    },
    /* Search */
    short: {},
    input: {},
    flex: {
      flex: 1,
    },
    search: {
      position: "relative",
      display: "flex",
      maxWidth: 600,
      [theme.breakpoints.down("sm")]: {
        marginBottom: theme.spacing(2),
      },
      [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        flex: 1,
      },
      "& form": {
        width: "100%",
      },
      alignItems: "center",
      [`&.${classes.short}`]: {
        width: 300,
      },
      [`& .${classes.input}`]: {
        width: "100%",
        paddingRight: theme.spacing(2),
        background: theme.palette.background.paper,
        paddingLeft: theme.spacing(5),
        borderRadius: theme.rounded.small,
        "& input": {
          maxHeight: "none",
          padding: theme.spacing(1.5, 0),
        },
      },
    },
    searchIcon: {
      position: "absolute",
      top: 10,
      left: theme.spacing(1),
    },
    /* Hamburger */
    invert: {},
    navLogo: {
      width: "100%",
      [`&.${classes.invert}`]: {
        [`& .${classes.logo}`]: {
          "& a": {
            color: theme.palette.text.primary,
          },
        },
        [`& .${classes.mobileMenu}`]: {
          [`& .${classes.bar}`]: {
            [theme.breakpoints.down("sm")]: {
              backgroundColor: theme.palette.text.secondary,
              "&:after, &:before": {
                backgroundColor: theme.palette.text.secondary,
              },
            },
          },
        },
      },
    },
    paperNav: {
      background: theme.palette.background.paper,
      backdropFilter: "saturate(180%) blur(20px)",
      width: "100%",
      position: "fixed",
      zIndex: 50,
      height: "100%",
    },
    mobileNav: {
      [`& .${classes.menu}`]: {
        padding: theme.spacing(0, 2),
        overflow: "auto",
        top: theme.spacing(15),
        width: "100%",
        position: "absolute",
        height: "calc(100% - 80px)",
        listStyle: "none",
        "& li": {
          textAlign: "center",
          animationTimingFunction: "ease",
          "& a": {
            fontSize: 24,
            padding: theme.spacing(1, 4),
            marginBottom: theme.spacing(),
            "&:before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 5,
              opacity: 0.2,
              background: `linear-gradient(120deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              height: "75%",
              width: 0,
              transition: "all 0.2s cubic-bezier(0, 0, 0.14, 0.97)",
            },
            "&:hover": {
              color: theme.palette.primary.main,
              background: "none",
              "&:before": {
                width: "100%",
              },
            },
          },
        },
      },
    },
    menuList: {
      textTransform: "capitalize",
      fontSize: 14,
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default headerStyles;
