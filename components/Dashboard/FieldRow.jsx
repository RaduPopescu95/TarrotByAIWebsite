import React from "react";
import { Typography, Grid } from "@mui/material";
import { StyledTextField } from "../../styles/FormStyles";

// The FieldRow component can be used for any text field within a form.
const FieldRow = ({
  id,
  name,
  label,
  value,
  onChange,
  widthLabel,
  isVideo,
  noFirstLabel,
}) => {
  return (
    <Grid
      item
      xs={12}
      sx={{
        flexDirection: "row",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "2%",
      }}
    >
      {!noFirstLabel && (
        <Typography sx={{ width: widthLabel, color: "#D3D3D3", mr: 2 }}>
          {label}
        </Typography>
      )}
      <StyledTextField
        id={id}
        name={name}
        label={label}
        fullWidth
        autoComplete={name}
        variant="outlined"
        value={value}
        onChange={onChange}
        disabled={isVideo}
      />
    </Grid>
  );
};

export default FieldRow;
