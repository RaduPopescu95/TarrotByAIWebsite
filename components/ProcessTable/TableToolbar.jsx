import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Divider,
  IconButton,
  Stack,
} from "@mui/material";
import FilterToolbarMenu from "./FilterToolbarMenu";
import RightToolbarMenu from "./RightToolbarMenu";
import ContractsToolbar from "./ContractsToolbar";
import * as icons from "../../data/Icons";

export default function TableToolbar(props) {
  console.log("table toolbarss..sas......");
  console.log(props.toolbarTitle);
  return (
    <Box>
      <Divider />
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#252525",
        }}
      >
        {props.isMainToolbar ? (
          <Toolbar>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ width: "100%" }}
            >
              {/* <FilterToolbarMenu /> */}
              <RightToolbarMenu
                handleShowSettings={props.handleShowSettings}
                handleShowAddContract={props.handleShowAddContract}
                handleShowSoloPopup={props.handleShowSoloPopup}
                settingsRef={props.settingsRef}
              />
            </Stack>
          </Toolbar>
        ) : // <ContractsToolbar db={props.db} toolbarTitle={props.toolbarTitle}/>
        null}
      </AppBar>
    </Box>
  );
}
