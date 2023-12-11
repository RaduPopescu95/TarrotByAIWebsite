import React, { useState } from "react";
import {
  MenuItem,
  InputAdornment,
  TextField,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { DialogTextField, useStyles } from "../../styles/DialogStyles";
import { MenuChapters } from "../../data/data";

export default function MenuTextField(props) {
  const classes = useStyles();

  const [gender, setGender] = useState("");
  const handleChange = (event) => {
    setGender(event.target.value);
  };

  return (
    <Box
      component="form"
      sx={{
        "& .MuiTextField-root": { m: 1, width: "25ch" },
      }}
      noValidate
      autoComplete="off"
    >
      <div>
        <DialogTextField
          id="outlined-select"
          select
          onChange={handleChange}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& > fieldset": { border: 0 },
              "&.Mui-focused fieldset": {
                border: 0,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {props.icon}
                <Typography>{gender === "" ? props.txt : ""}</Typography>
              </InputAdornment>
            ),
            classes: { notchedOutline: classes.noBorder },
          }}
        >
          {MenuChapters.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.value}
            </MenuItem>
          ))}
        </DialogTextField>
      </div>
    </Box>
  );
}
