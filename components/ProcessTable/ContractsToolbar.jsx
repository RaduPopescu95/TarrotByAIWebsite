import Toolbar from "@mui/material/Toolbar";
import ToolbarComponent from "./ToolbarComponent";
import * as icons from "../../data/Icons";
import { Box, Stack, Typography } from "@mui/material";

export default function ContractsToolbar({ db, toolbarTitle }) {
  console.log("ASdasdsdsdasdasdssasad");
  console.log(db);
  return (
    <>
      <Toolbar>
        <Stack direction="row" alignItems={"center"}>
          <ToolbarComponent
            icon={<icons.StartOutlinedIcon fontSize={"medium"} />}
            txt={`${toolbarTitle}`}
            padingR={1}
          />

          <Box
            sx={{
              backgroundColor: "#D6D5D9",
              borderRadius: 1,
              mx: 2,
              px: 2,
              maxHeight: "30px",
            }}
          >
            {/* <Typography variant="body2" color={"black"}>
              {db ? `${db.length} articles` : "No articles"}
            </Typography> */}
          </Box>
        </Stack>
      </Toolbar>
    </>
  );
}
