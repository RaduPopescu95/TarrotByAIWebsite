import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { canRerenderElaiStatus, ensureElaiMeta } from "../../utils/elaiStatusUtils";

export default function ElaiVideoPreviewDialog({
  open,
  onClose,
  recordId,
  lang,
  info,
  onRetrySingle,
  isRetryingSingle = false,
}) {
  const normalized = useMemo(() => ensureElaiMeta(info || {}), [info]);
  const [copyMessage, setCopyMessage] = useState("");

  const hasUrl = normalized.url.length > 0;
  const canRetry = Boolean(normalized._id) && canRerenderElaiStatus(normalized.elaiStatus);
  const languageLabel = typeof lang === "string" && lang ? lang.toUpperCase() : "-";

  const handleCopyLink = async () => {
    if (!hasUrl) return;
    try {
      await navigator.clipboard.writeText(normalized.url);
      setCopyMessage("Link copied.");
    } catch (error) {
      console.error("[elai.preview] copy_fail", error);
      setCopyMessage("Copy failed.");
    }
  };

  const handleOpenInNewTab = () => {
    if (!hasUrl) return;
    try {
      const safeUrl = new URL(normalized.url);
      window.open(safeUrl.toString(), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("[elai.preview] open_fail", error);
      window.open(normalized.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleClose = () => {
    setCopyMessage("");
    onClose?.();
  };

  const handleRetrySingle = () => {
    if (!canRetry || !onRetrySingle) return;
    onRetrySingle({
      recordId,
      lang,
      info: normalized,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{`Record #${recordId || "-"} - ${languageLabel}`}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {hasUrl ? (
            <Box sx={{ backgroundColor: "#000", borderRadius: 1, overflow: "hidden" }}>
              <video controls style={{ width: "100%", maxHeight: "480px" }} preload="metadata">
                <source src={normalized.url} type="video/mp4" />
                Browserul nu poate reda acest video. Foloseste Open in new tab.
              </video>
            </Box>
          ) : (
            <Alert severity="info">Nu exista URL video in Firebase pentru limba selectata.</Alert>
          )}

          <TextField
            label="URL"
            value={normalized.url}
            placeholder="(fara URL)"
            fullWidth
            size="small"
            InputProps={{ readOnly: true }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Button variant="contained" onClick={handleCopyLink} disabled={!hasUrl}>
              Copy link
            </Button>
            <Button variant="outlined" onClick={handleOpenInNewTab} disabled={!hasUrl}>
              Open in new tab
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleRetrySingle}
              disabled={!canRetry || isRetryingSingle}
            >
              {isRetryingSingle ? "Retrying..." : "Retry this language"}
            </Button>
            {copyMessage ? (
              <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
                {copyMessage}
              </Typography>
            ) : null}
          </Stack>
          {!canRetry ? (
            <Typography variant="caption" sx={{ color: "#BDBDBD" }}>
              Retry este disponibil doar pentru status draft/error cu video ID valid.
            </Typography>
          ) : null}

          <Box>
            <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
              Detalii Elai
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">Status: {normalized.elaiStatus || "-"}</Typography>
              <Typography variant="body2">Video ID: {normalized._id || "-"}</Typography>
              <Typography variant="body2">
                Last sync: {normalized.lastElaiSyncAt || "-"}
              </Typography>
              <Typography variant="body2">
                Last render attempt: {normalized.lastRenderAttemptAt || "-"}
              </Typography>
              <Typography variant="body2">Error: {normalized.elaiError || "-"}</Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
