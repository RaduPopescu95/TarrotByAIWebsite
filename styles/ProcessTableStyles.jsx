import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles({
  button: {
    "&:hover": {
      backgroundColor: "#CDCDCD",
      border: 0,
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
  mainBox: {
    p: 0,
    width: "100%",
    overflow: "auto",
  },
  opacDialogBox: {
    backgroundColor: "grey.500",
    opacity: "1",
    width: "100%",
    position: "absolute",
    zIndex: 4,
    display: "flex",
    height: "100%",
  },
  mainDialogBox: {
    position: "absolute",
    zIndex: 5,
    minWidth: 300,
    width: "93%",
    height: "95%",
    borderRadius: 4,
    top: "2%",
    left: "6%",
    overflow: "auto",
    backgroundColor: "primary.light",
  },
  gridContainerBox: {
    height: "90%",
    width: "95%",
    display: "flex",
    flexDirection: "row",
  },
});

export { useStyles };
