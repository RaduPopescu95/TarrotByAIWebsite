import * as React from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Slide,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import * as data from "../../data/data";
import * as styles from "../../styles/MainScreenStyles";
import { useStyles } from "../../styles/ProcessTableStyles";
import CustomToolbar from "./CustomToolbar";

import LeftForm from "./LeftForm";
import LeftFormService from "./LeftFormService";
import StartFormService from "./StartFormService";

export default function CustomServiceDialog(props) {
  const [selectedItem, setSelectedItem] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const classes = useStyles();
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleDeleteAlert = () => {
    handleClickOpen();
  };
  const handleDeleteService = () => {
    handleClose();
    console.log(props.serviceData);
    props.handleShowDialog();
    props.handleDeleteArt(
      props.serviceData.id,
      props.serviceData.image.fileName
    );
  };

 
  return (
    <>
      <Dialog
        fullScreen
        open={props.handleShowDialog}
        onClose={props.handleShowDialog}
        TransitionComponent={Slide}
        sx={{ overflowY: "auto"}}
      >
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Do you want to delete this service?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              The service will be deleted and it cannot be restored.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleDeleteService} autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Box component="main"></Box>
        <Stack direction={"row"}>
          <Stack
            direction={"column"}
            sx={{ width: "100%" }}
            alignItems={"center"}
          >
            <CustomToolbar
              data={props.serviceData}
              handleShowDialog={props.handleShowDialog}
              handleDeleteAlert={handleDeleteAlert}
            />
            <Box sx={[styles.gridContainerBox, {padding:1}]}>
              <StartFormService
                serviceData={props.serviceData}
                handleEditService={props.handleEditService}
              />
            </Box>
            <Stack direction="row" sx={{ position: "relative", mt: 8 }}>
              <Typography variant="body2" mr={1}>
                Service ID:
              </Typography>
              <Typography>{props.serviceData.id}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
}
