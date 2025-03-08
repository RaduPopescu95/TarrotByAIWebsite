import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles({ uniqId: "logo" })((theme) => ({
  logo: {
    fontWeight: theme.typography.fontWeightBold,
    color: theme.palette.text.primary,
    display: "flex",
  },
  landscape: {
    alignItems: "center",
    position: "relative",
    top: -2,
    "& img": {
      marginRight: theme.spacing(1),
    },
  },
  portrait: {
    display: "block",
    margin: "0 auto 8px",
    "& img": {
      margin: `0 auto ${theme.spacing(1)}`,
      display: "block",
    },
  },
  small: {
    fontSize: 16,
    "& img": {
      width: 'auto', // Use 'auto' for width to maintain the aspect ratio
      height: 34, // Set either width or height, not both
    },
  },
  medium: {
    fontSize: 18,
    "& img": {
      width: 'auto', // Adjust accordingly
      height: 44, // Adjust accordingly
    },
  },
  large: {
    fontSize: 28,
    "& img": {
      width: 'auto', // Adjust accordingly
      height: 'auto', // Use 'auto' to maintain the aspect ratio
      maxHeight: 64, // Use 'maxHeight' to set the maximum height
    },
  },
}));

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default useStyles;
