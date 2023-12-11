import { IconButton, Stack, Typography } from "@mui/material";
import InitialButton from "./InitialButton";
import LabelButton from "./LabelButton";
import MenuDate from "./MenuDate";
import MenuTextField from "./MenuTextField";
import MenuDivider from "./MenuDivider";
import DatabaseChip from "./DatabaseChip";
import * as icons from "../../data/Icons";

export default function DialogMenu() {
  return (
    <>
      <Stack
        direction="column"
        sx={{
          borderBottom: 2,
          pb: 1,
          borderBottomColor: "rgba(234, 234, 236, 1)",
        }}
      >
        <Stack
          direction="row"
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Stack direction="row" alignItems={"center"}>
            <InitialButton />
            <InitialButton />
            <InitialButton />
            <InitialButton />
            <Typography variant="body2">+5</Typography>
            <IconButton>
              <icons.ControlPointOutlinedIcon color="warning" />
            </IconButton>
          </Stack>
          <MenuTextField
            icon={<icons.ArrowRightAltIcon color="warning" />}
            txt={"Chapter One"}
          />
          <MenuDate />
        </Stack>
        <Stack direction="row" mt={1} alignItems={"center"}>
          <LabelButton bgColor={"rgba(71, 189, 255, 1)"} txt={"Label 1"} />
          <LabelButton bgColor={"rgba(229, 71, 255, 1)"} txt={"Label 2"} />
          <LabelButton bgColor={"rgba(255, 159, 71, 1)"} txt={"Label 3"} />
          <IconButton>
            <icons.ControlPointOutlinedIcon color="warning" />
          </IconButton>
        </Stack>
        <Stack
          direction="row"
          justifyContent={"flex-start"}
          alignItems={"center"}
        >
          <MenuTextField
            icon={<icons.PermIdentityOutlinedIcon />}
            txt={"Select vendors"}
          />
          <MenuDivider />
          <Stack direction="row" alignItems={"center"}>
            <DatabaseChip txt={"#database_object_1"} />
            <DatabaseChip txt={"#db-oject1"} />
          </Stack>
        </Stack>
      </Stack>
    </>
  );
}
