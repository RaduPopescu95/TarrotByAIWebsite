import { styled } from "@mui/system";
import TextField from "@mui/material/TextField";

const StyledTextField = styled(TextField, {
  name: "StyledTextField",
})({
  width: "100%",
  "& .MuiInputBase-root": {
    height: 42,
    top: 5,
    borderRadius: 8,
  },
});

const mainGrid = {
  height: "100vh",
  flexWrap: "wrap",
  overFlow: "hidden",
};

const formGrid = {
  zIndex: 2,
  overflow: "hidden",
};

const resetPasswordGridForm = {
  zIndex: 2,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
  display: "flex",
};

const confirmationGrid = {
  zIndex: 2,
  overflow: "hidden",
  backgroundColor: "white",
};

const visualsGrid = {
  backgroundColor: "#252525",
  overflow: "hidden",
  height: "100%",
};

const container = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  my: 8,
};

const confirmationContainer = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  positon: "relative",
  mt: 10,
  mr: 15,
  width: "70%",
};

const controlLabelBox = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
};

const img = {
  height: "50px",
  width: "50px",
  position: "relative",
  top: -60,
};

const link = {
  textDecorationLine: "none",
  textDecoration: "none",
  color: "#2CCFBC",
};

const TextFieldBox = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  flexDirection: "column",
};

const FieldBoxSecondary = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
};

const btn = { mt: 3, mb: 2, textTransform: "capitalize", borderRadius: "8px" };

const formFooterGrid = {
  display: "flex",
  flexDirection: "row",
  mt: 1,
  justifyContent: "flex-start",
};

const formFooterBox = {
  display: "flex",
  alignItems: "center",
  flexDirection: "row",
};

const signUpLink = {
  textDecorationLine: "none",
  textDecoration: "none",
  marginLeft: 2.5,
  color: "#2CCFBC",
  fontWeight: 600,
};

const formControlStack = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  py: 1,
  minHeight: "140px",
};

export {
  mainGrid,
  formGrid,
  visualsGrid,
  container,
  controlLabelBox,
  link,
  img,
  confirmationContainer,
  StyledTextField,
  TextFieldBox,
  FieldBoxSecondary,
  confirmationGrid,
  btn,
  formFooterGrid,
  formFooterBox,
  signUpLink,
  formControlStack,
  resetPasswordGridForm,
};
