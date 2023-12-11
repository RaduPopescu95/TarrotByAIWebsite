import { makeStyles } from "tss-react/mui";

const expertiseStyle = makeStyles({ uniqId: "expertise" })(
  (theme, _params, classes) => ({
    root: {
      position: "relative",
      [theme.breakpoints.down("md")]: {
        textAlign: "center",
      },
      "& h4": {
        [theme.breakpoints.down("md")]: {
          marginTop: theme.spacing(-3),
        },
      },
    },
    decoration: {
      marginLeft: 10,
      marginTop: 10,
      fill: "#252525",
      stroke: "#252525",
      height: 600,
      width: 600,
      position: "absolute",
      top: -200,
      left: -240,
      backgroundSize: "100%",
      [theme.breakpoints.down("lg")]: {
        transform: "scale(0.8)",
      },
    },
    titleDeco: {
      position: "relative",
    },
    desc: {
      lineHeight: "32px",
    },
    illustrationWrap: {
      position: "relative",
      top: -240,
      left: -230,
      height: 200,
      transformOrigin: "top",
      "& span": {
        backgroundSize: "100%",
        position: "relative",
        display: "block",
      },
      [theme.breakpoints.down("md")]: {
        display: "none",
      },
    },
    list: {
      marginTop: theme.spacing(4),
    },
    iconGreen: {
      top: -179,
      left: 30,
      width: 320,
      height: 600,
      background: `red`,
    },
    iconViolet: {
      width: 560,
      height: 560,
      left: -50,
      top: -620,
      background: `red`,
    },
    iconBlue: {
      width: 560,
      height: 560,
      left: 0,
      top: -1170,
      background: `red`,
    },
    descIcon: {
      width: 34,
      height: 34,
      borderRadius: 8,
      transform: "rotate(45deg)",
      marginBottom: theme.spacing(),
      [theme.breakpoints.down("md")]: {
        marginLeft: "auto",
        marginRight: "auto",
      },
    },
    icon: {
      transform: "rotate(-45deg)",
      margin: "4px 0px 0px 5px",
      [theme.breakpoints.down("md")]: {
        margin: "5px 0px 0px 0px",
      },
    },
    iconPrimary: {
      background: theme.palette.primary.light,
      [`& .${classes.icon}`]: {
        color: theme.palette.primary.dark,
      },
    },
    iconSecondary: {
      background: theme.palette.secondary.light,
      [`& .${classes.icon}`]: {
        color: theme.palette.secondary.dark,
      },
    },
    iconAccent: {
      background: theme.palette.accent.light,
      [`& .${classes.icon}`]: {
        color: theme.palette.accent.dark,
      },
    },
    iconAccent2: {
      background: "#FBEABB",
      [`& .${classes.icon}`]: {
        color: "#F38D21",
      },
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default expertiseStyle;
