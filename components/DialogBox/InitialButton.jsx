import { Fab } from "@mui/material";
import React from "react";
import ControlPointOutlinedIcon from "@mui/icons-material/ControlPointOutlined";

export default function InitialButton() {
  return (
    <>
      <Fab
        variant="extended"
        sx={{
          boxShadow: 0,
          mr: 1,
        }}
        color="primary"
        size="small"
      >
        PL
      </Fab>
    </>
  );
}
