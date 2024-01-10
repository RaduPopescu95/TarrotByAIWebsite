import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles({
  tableRow: {
    height: 30,
  },
  tableCell: {
    padding: "0px 16px",
  },
});

const menuItem = {
  borderRadius: 3,
  mb: 0.5,
  color: "white",
  mx: 0.1,
};

const settingsTableBox = {
  height: "100%",
  width: "95%",
  bgcolor: "background.paper",
  borderLeft: 3,
  borderLeftColor: "#EAEAEC",
  ml: 5,
  px: 2,
};

export { useStyles, menuItem, settingsTableBox };
