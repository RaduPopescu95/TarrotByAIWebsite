import {
  AppBar,
  Box,
  Toolbar,
  Divider,
  Stack,
} from "@mui/material";

import RightToolbarMenu from "./RightToolbarMenu";

export default function TableToolbar(props) {
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
                showNume={props.showNume}
                showDesc={props.showDesc}
                isElaiDownload={props.isElaiDownload}
                handleSearchFilter={props.handleSearchFilter}
                onSyncElaiStatus={props.onSyncElaiStatus}
                onRetrySelected={props.onRetrySelected}
                onRetrySelectedRow={props.onRetrySelectedRow}
                onSyncSelectedRow={props.onSyncSelectedRow}
                retryDisabled={props.retryDisabled}
                rowModeDisabled={props.rowModeDisabled}
                isSyncingElaiStatus={props.isSyncingElaiStatus}
                isRetryingElai={props.isRetryingElai}
                isRetryingSelectedRow={props.isRetryingSelectedRow}
                isSyncingSelectedRow={props.isSyncingSelectedRow}
              />
            </Stack>
          </Toolbar>
        ) : // <ContractsToolbar db={props.db} toolbarTitle={props.toolbarTitle}/>
        null}
      </AppBar>
    </Box>
  );
}
