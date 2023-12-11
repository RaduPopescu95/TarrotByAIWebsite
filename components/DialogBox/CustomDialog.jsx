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
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import * as data from "../../data/data";
import * as styles from "../../styles/MainScreenStyles";
import { useStyles } from "../../styles/ProcessTableStyles";
import CustomToolbar from "./CustomToolbar";
import LeftForm from "./LeftForm";
import { CloseOutlinedIcon } from "../../data/Icons";
import StartForm from "./StartForm";

export default function CustomDialog(props) {
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
  const handleDeleteArticle = () => {
    handleClose();

    props.handleShowDialog();
    props.handleDeleteArt(
      props.articleData.id,
      props.articleData.image.fileName
    );
  };

  return (
    <>
      <Dialog
        fullScreen
        open={props.handleShowDialog}
        onClose={props.handleShowDialog}
        TransitionComponent={Slide}
        sx={{ overflowY: "auto" }}
      >
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Do you want to delete this article?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              The article will be deleted and it cannot be restored.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleDeleteArticle} autoFocus>
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
              data={props.articleData}
              handleShowDialog={props.handleShowDialog}
              handleDeleteAlert={handleDeleteAlert}
            />
            <Box sx={[styles.gridContainerBox, { padding: 1 }]}>
              <StartForm
                articleData={props.articleData}
                handleEditArticle={props.handleEditArticle}
              />
            </Box>
            <Stack direction="row" sx={{ position: "relative", mt: 8 }}>
              <Typography variant="body2" mr={1}>
                Article ID:
              </Typography>
              <Typography>{props.articleData.id}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
}
