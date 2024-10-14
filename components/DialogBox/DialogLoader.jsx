import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import React from "react";

export default function LoadingDialog({ loading, setLoading }) {
  return (
    <Dialog open={loading} onClose={setLoading}>
      <DialogContent>
        <CircularProgress />
      </DialogContent>
    </Dialog>
  );
}
