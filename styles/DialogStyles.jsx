import { styled } from "@mui/system";
import { makeStyles } from "tss-react/mui";
import TextField from "@mui/material/TextField";

const DialogTextField = styled(TextField, {
  name: "StyledTextField",
})({
  width: "100%",
  "& .MuiInputBase-root": {
    height: 18,
    width: 155,
  },
});

const useStyles = makeStyles(() => ({
  noBorder: {
    border: "none",
  },
}));

const accordionSummary = {
  borderRadius: 4,
  backgroundColor: "rgba(246, 248, 250, 1)",
  height: "51px",
};

const accordionSummaryBox = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
};

const typoBox = {
  backgroundColor: "warning.light",
  borderRadius: "100px",
  width: "75px",
};

const databaseChip = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "rgba(214, 213, 217, 1)",
  borderRadius: "100px",
  px: "10px",
  ml: "10px",
};

export {
  DialogTextField,
  useStyles,
  accordionSummary,
  accordionSummaryBox,
  typoBox,
  databaseChip,
};
