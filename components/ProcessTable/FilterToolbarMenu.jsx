import * as React from "react";
import Button from "@mui/material/Button";
import { Stack } from "@mui/material";
import SelectorTextField from "./SelectorTextField";
import ToolbarDivider from "./ToolbarDivider";
import * as icons from "../../data/Icons";
import { useStyles } from "../../styles/ProcessTableStyles";

export default function FilterToolbarMenu() {
  const classes = useStyles();
  return (
    <Stack
      direction="row"
      alignItems={"center"}
      justifyContent={"space-between"}
    >
      <Button
        variant="outlined"
        startIcon={
          <icons.FilterAltOutlinedIcon fontSize={"medium"} color="warning" />
        }
        sx={{
          border: 0,
          textTransform: "Capitalize",
          fontColor: "rgba(131, 130, 142, 1)",
        }}
        className={classes.button}
      >
        Filters
      </Button>
      <ToolbarDivider />

      <Button
        variant="outlined"
        startIcon={
          <icons.UnfoldMoreOutlinedIcon fontSize={"medium"} color="warning" />
        }
        sx={{
          border: 0,
          textTransform: "Capitalize",
          fontColor: "rgba(131, 130, 142, 1)",
        }}
        className={classes.button}
      >
        Orders
      </Button>
      <ToolbarDivider />
    </Stack>
  );
}
