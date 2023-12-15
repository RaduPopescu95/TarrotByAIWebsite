import IconButton from "@mui/material/IconButton";
import { Box, Button, InputAdornment, Stack, TextField } from "@mui/material";
import * as icons from "../../data/Icons";
import { useStyles } from "../../styles/ProcessTableStyles";
import {
  createImgApiUrl,
  deleteFirebaseVariatiiCarti,
  fetchDataReplaceFirebase,
} from "../../utils/apiUtils";
import FieldRow from "../Dashboard/FieldRow";
import { StyledTextField } from "../../styles/FormStyles";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import { getUrlImg } from "../../utils/realtimeUtils";

export default function RightToolbarMenu(props) {
  const [value, setValue] = useState("");
  const classes = useStyles();
  const handleSearch = (val) => {
    setValue(val);
    props.handleSearchFilter(val);
  };

  const handleUrl = async () => {
    console.log("start....");
    const urlImage = await getUrlImg();
    console.log(urlImage);
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
            label={"Search"}
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
              <icons.AddCircleOutlineIcon
                fontSize={"medium"}
                sx={{ color: "white" }}
              />
            }
            sx={{
              fontSize: "15px",
              fontWeight: "700",
              backgroundColor: "transparent",
              color: "white",
              width: "auto",
              textTransform: "none",
              border: "1px solid #d3a03e",
              transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
              "&:hover": {
                backgroundColor: "#ffc045", // Culorea de fundal pentru hover
                border: "1px solid ##ffc045", // Adaugă o bordură la hover
              },
            }}
            className={classes.buttonHeader}
            onClick={() => props.handleShowSettings()}
          >
            Add
          </Button>
        </Box>
        {props.isElaiDownload && (
          <Button
            variant="contained"
            sx={{
              fontSize: "15px",
              fontWeight: "700",
              backgroundColor: "transparent",
              color: "white",
              width: "auto",
              textTransform: "none",
              border: "1px solid #d3a03e",
              transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
              "&:hover": {
                backgroundColor: "#ffc045", // Culorea de fundal pentru hover
                border: "1px solid ##ffc045", // Adaugă o bordură la hover
              },
            }}
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
            sx={{
              fontSize: "15px",
              fontWeight: "700",
              backgroundColor: "transparent",
              color: "white",
              width: "auto",
              textTransform: "none",
              border: "1px solid #d3a03e",
              transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
              "&:hover": {
                backgroundColor: "#ffc045", // Culorea de fundal pentru hover
                border: "1px solid ##ffc045", // Adaugă o bordură la hover
              },
            }}
            className={classes.buttonHeader}
            // onClick={handleUrl}
            onClick={() => createImgApiUrl()}
            // onClick={() => deleteFirebaseVariatiiCarti()}
          >
            Create Elai Photo
          </Button>
        )}
      </Stack>
    </>
  );
}
