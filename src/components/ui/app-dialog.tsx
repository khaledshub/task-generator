"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  type DialogProps,
} from "@mui/material";
import { useId, type PropsWithChildren } from "react";

interface AppDialogProps extends PropsWithChildren {
  open: boolean;
  onClose: NonNullable<DialogProps["onClose"]>;
  title: string;
  description?: string;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
}

/**
 * Accessible shared dialog wrapper with title, description, and close control.
 */
export function AppDialog({
  open,
  onClose,
  title,
  description,
  maxWidth = "md",
  fullWidth = true,
  children,
}: AppDialogProps) {
  const generatedId = useId();
  const dialogTitleId = `${generatedId}-title`;
  const dialogDescriptionId = `${generatedId}-description`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby={dialogTitleId}
      aria-describedby={description ? dialogDescriptionId : undefined}
    >
      <DialogTitle id={dialogTitleId} sx={{ pr: 7 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <span>{title}</span>
          <IconButton
            aria-label="Close dialog"
            edge="end"
            onClick={(event) => onClose(event, "escapeKeyDown")}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {description ? (
          <Typography
            id={dialogDescriptionId}
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {description}
          </Typography>
        ) : null}
        {children}
      </DialogContent>
    </Dialog>
  );
}
