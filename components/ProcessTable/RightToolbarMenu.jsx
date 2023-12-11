import IconButton from "@mui/material/IconButton";
import { Button, Stack } from "@mui/material";
import * as icons from "../../data/Icons";
import { useStyles } from "../../styles/ProcessTableStyles";

export default function RightToolbarMenu(props) {
  const classes = useStyles();
  return (
    <>
      <Stack direction="row" alignItems={"center"} spacing={2}>
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
          onClick={() => props.handleShowAddContract()}
        >
          Add
        </Button>
      </Stack>
    </>
  );
}
