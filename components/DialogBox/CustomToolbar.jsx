import React from "react";
import {
  AppBar,
  Toolbar,
  Stack,
  Typography,
  IconButton,
  Box,
  Divider,
} from "@mui/material";
import * as icons from "../../data/Icons";

export default function CustomToolbar({
  data,
  handleShowDialog,
  handleDeleteAlert,
}) {
  return (
    <AppBar
      position="absolute"
      color="default"
      elevation={0}
      sx={{
        position: "relative",
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        border: 0,
        backgroundColor: "#303030",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h1"
          color="white"
          noWrap
          fontSize={30}
          fontWeight={"bold"}
        >
          {data.title}
        </Typography>
        <Stack direction="row" alignItems={"center"}>
          <IconButton onClick={handleDeleteAlert} sx={{ color: "white" }}>
            <icons.DeleteOutlineOutlinedIcon />
          </IconButton>
          <IconButton onClick={handleShowDialog} sx={{ color: "white" }}>
            <icons.CloseOutlinedIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
