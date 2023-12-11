import { makeStyles } from "tss-react/mui";

const testiStyles = makeStyles({ uniqId: "testi" })((theme) => ({
  testimonialWrap: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  carousel: {
    height: 400,
    // backgroundColor: "red",
    marginTop: theme.spacing(3),
  },
  item: {
    padding: theme.spacing(2),
  },
  cardWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 10,
  },
  dotsStyle: {
    "& ul li button:after": {
      borderColor: "#d3a03e !important",
      backgroundColor: "#d3a03e !important",
      marginTop: 20,
    },
  },
}));

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default testiStyles;
