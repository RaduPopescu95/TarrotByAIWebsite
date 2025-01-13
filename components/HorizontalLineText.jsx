import React from "react";
import { Box, Divider, Typography } from "@mui/material";

function HorizontalLineWithText({ text, style }) {
  return (
    <Box
      sx={[
        {
          width: "100%",
          display: "flex",
          alignItems: "center",
          ...style,
        },
      ]}
    >
      <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "#5A5A5A" }} />
      {text && (
        <Typography
          sx={{
            color: "#C0C0C0",
            fontWeight: "600",
            fontSize: 20,
            mx: 2, // margin on the left and right of the text
          }}
        >
          {text}
        </Typography>
      )}
      <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "#5A5A5A" }} />
    </Box>
  );
}

export default HorizontalLineWithText;
