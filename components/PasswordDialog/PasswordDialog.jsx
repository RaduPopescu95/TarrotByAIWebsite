import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export default function PasswordDialog({
  currentPassword,
  setCurrentPassword,
  modalVisible,
  setModalVisible,
  handleSubmit,
}) {
  const handleClickOpen = () => {};

  const handleClose = () => {
    setModalVisible(!modalVisible);
  };

  return (
    <React.Fragment>
      <Dialog open={modalVisible} onClose={handleClose}>
        <DialogTitle>Current Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter your current password
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            fullWidth
            type="password"
            variant="standard"
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} type="submit">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
