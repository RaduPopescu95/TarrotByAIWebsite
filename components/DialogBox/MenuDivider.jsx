import { Box } from "@mui/material";
import React from "react";

export default function MenuDivider() {
  return (
    <Box
      sx={{
        backgroundColor: "rgba(234, 234, 236, 1)",
        width: "2px",
        height: "24px",
        mx: "20px",
      }}
    ></Box>
  );
}
