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
  "& input": {
    color: "#D3D3D3", // Text color
  },
  "& fieldset": {
    borderColor: "#D3D3D3", // Border color
  },
  "&:hover fieldset": {
    borderColor: "#D3D3D3", // Border color on hover
  },
  "&.Mui-focused fieldset": {
    borderColor: "#D3D3D3", // Border color when focused
  },
  "& .MuiInputLabel-root": {
    color: "#D3D3D3", // Label color
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#D3D3D3", // Label color when focused
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D3D3D3", // Ensure border color is #D3D3D3 when focused for outlined variant
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D3D3D3", // Ensure the border color is #D3D3D3 on hover for outlined variant
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
