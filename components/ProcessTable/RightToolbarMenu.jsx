import { Box, Button, InputAdornment, Stack } from "@mui/material";

import { useStyles } from "../../styles/ProcessTableStyles";
import {
  createImgApiUrl,
  fetchDataReplaceFirebase,
  fetchDataReplaceFirebaseOneVideo,
} from "../../utils/apiUtils";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { StyledTextField } from "../../styles/FormStyles";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";

export default function RightToolbarMenu(props) {
  const [value, setValue] = useState("");
  const classes = useStyles();
  const headerButtonSx = {
    fontSize: "15px",
    fontWeight: "700",
    backgroundColor: "transparent",
    color: "white",
    width: "auto",
    textTransform: "none",
    border: "1px solid #d3a03e",
    transition: "background-color 0.3s",
    "&:hover": {
      backgroundColor: "#ffc045",
      border: "1px solid ##ffc045",
    },
  };

  const handleSearch = (val) => {
    setValue(val);
    props.handleSearchFilter?.(val);
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <StyledTextField
            id={"Search"}
            name={"Search"}
            fullWidth
            autoComplete={"Search"}
            variant="outlined"
            value={value}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ position: "relative", bottom: "12%", marginRight: "5%" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "white" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={
              <AddCircleOutlineIcon
                fontSize={"medium"}
                sx={{ color: "white" }}
              />
            }
            sx={headerButtonSx}
            className={classes.buttonHeader}
            onClick={() => props.handleShowSettings()}
          >
            Add
          </Button>
        </Box>
        {props.isElaiDownload && (
          <Button
            variant="contained"
            sx={headerButtonSx}
            className={classes.buttonHeader}
            onClick={() => fetchDataReplaceFirebaseOneVideo()}
            // onClick={() => deleteFirebaseVariatiiCarti()}
          >
            Download ELAI one video
          </Button>
        )}
        {props.isElaiDownload && (
          <Button
            variant="contained"
            sx={headerButtonSx}
            className={classes.buttonHeader}
            onClick={() => fetchDataReplaceFirebase()}
            // onClick={() => deleteFirebaseVariatiiCarti()}
          >
            Download ELAI
          </Button>
        )}
        {props.isElaiDownload && (
          <Button
            variant="contained"
            sx={headerButtonSx}
            className={classes.buttonHeader}
            onClick={() => createImgApiUrl()}
            // onClick={() => deleteFirebaseVariatiiCarti()}
          >
            Create Elai Photo
          </Button>
        )}
        {props.isElaiDownload && (
          <Button
            variant="contained"
            sx={headerButtonSx}
            className={classes.buttonHeader}
            onClick={() => props.onSyncElaiStatus?.()}
            disabled={props.isSyncingElaiStatus}
          >
            {props.isSyncingElaiStatus ? "Syncing..." : "Sync ELAI status"}
          </Button>
        )}
        {props.isElaiDownload && (
          <Button
            variant="contained"
            sx={headerButtonSx}
            className={classes.buttonHeader}
            onClick={() => props.onRetrySelected?.()}
            disabled={props.retryDisabled || props.isRetryingElai}
          >
            {props.isRetryingElai ? "Retrying..." : "Retry selected draft/error"}
          </Button>
        )}
      </Stack>
    </>
  );
}
