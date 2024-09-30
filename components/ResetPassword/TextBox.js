import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function TextBox(props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        flexDirection: "column",
        ...props.styles,
      }}
      mb={3}
    >
      <Typography variant="h4" my={1}>
        {props.txt}
      </Typography>
      <Typography variant="body2">{props.subTxt}</Typography>
      {props.confTxt && (
        <Typography variant="body2">{props.confTxt}</Typography>
      )}
    </Box>
  );
}
