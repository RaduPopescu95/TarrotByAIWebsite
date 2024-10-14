import React, { useState } from "react";
import { Typography, Grid, MenuItem } from "@mui/material";
import { StyledSelect } from "../../styles/FormStyles"; // Asumând că ați salvat StyledSelect aici

const DropdownFieldRow = ({
  id,
  name,
  label,
  value,
  onChange,
  widthLabel,
  options,
  placeholder,
}) => {
  const [currentValue, setCurrentValue] = useState(value ? value : null);
  // Funcția de manipulare a schimbării
  const handleChange = (event) => {
    // Găsirea obiectului option pe baza valorii selectate
    const selectedOption = options.find(
      (option) => option.id === event.target.value
    );
    console.log("Selectat:", selectedOption);
    setCurrentValue(selectedOption.id);
    // Actualizarea valorii selectate
    onChange(selectedOption, label); // Presupunând că doriți să actualizați valoarea cu valoarea opțiunii
  };

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
      <Typography sx={{ width: widthLabel, color: "#D3D3D3", mr: 0 }}>
        {label}
      </Typography>
      <StyledSelect
        id={id}
        name={name}
        fullWidth
        value={currentValue} // Folosiți valoarea pasată ca prop
        onChange={handleChange}
        displayEmpty
        inputProps={{ "aria-label": "Without label" }}
      >
        <MenuItem value="" disabled>
          {label}
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.info.ro.nume}
          </MenuItem>
        ))}
      </StyledSelect>
    </Grid>
  );
};

export default DropdownFieldRow;
