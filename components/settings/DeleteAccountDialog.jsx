import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useTranslation } from "next-i18next";
import {
  userCanReauthWithGoogle,
  userRequiresPasswordForDeletion,
} from "../../utils/accountDeletionClient";
import { authentication } from "../../firebase";

export default function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
}) {
  const { t } = useTranslation("common");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const user = authentication.currentUser;
  const needsPassword = userRequiresPasswordForDeletion(user);
  const canUseGoogle = userCanReauthWithGoogle(user);

  React.useEffect(() => {
    if (!open) {
      setCurrentPassword("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm({ currentPassword, useGoogle: !needsPassword && canUseGoogle });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("deleteAccountConfirmTitle")}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{t("deleteAccountConfirmBody")}</DialogContentText>
        {needsPassword ? (
          <TextField
            autoFocus
            required
            margin="dense"
            id="deleteAccountCurrentPassword"
            name="deleteAccountCurrentPassword"
            label={t("enterPasswordCurrent")}
            fullWidth
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={loading}
          />
        ) : null}
        {!needsPassword && canUseGoogle ? (
          <DialogContentText>{t("deleteAccountReauthGoogle")}</DialogContentText>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("cancel")}
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || (needsPassword && !currentPassword.trim())}
        >
          {loading ? t("deleteAccountDeleting") : t("deleteAccount")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
