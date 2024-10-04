import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import React from "react";

export default function DeleteDialog({
  openConfirmDialog,
  handleDelete,
  confirmDelete,
}) {
  return (
    <Dialog open={openConfirmDialog} onClose={handleDelete}>
      <DialogTitle>{"Sunteți sigur că vreți să ștergeți?"}</DialogTitle>
      <DialogActions>
        <Button onClick={handleDelete} color="primary">
          Anulează
        </Button>
        <Button onClick={confirmDelete} color="primary" autoFocus>
          Șterge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
