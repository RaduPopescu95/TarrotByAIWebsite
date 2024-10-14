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

export {
  DialogTextField,
  useStyles,
  accordionSummary,
  accordionSummaryBox,
  typoBox,
  databaseChip,
};
