"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
  type DrawerProps,
} from "@mui/material";
import { useId, type PropsWithChildren } from "react";

interface AppDrawerProps extends PropsWithChildren {
  open: boolean;
  onClose: NonNullable<DrawerProps["onClose"]>;
  title: string;
  description?: string;
  anchor?: DrawerProps["anchor"];
  width?: number;
}

/**
 * Accessible shared drawer wrapper for in-place task workflows.
 */
export function AppDrawer({
  open,
  onClose,
  title,
  description,
  anchor = "right",
  width = 480,
  children,
}: AppDrawerProps) {
  const generatedId = useId();
  const drawerTitleId = `${generatedId}-title`;
  const drawerDescriptionId = `${generatedId}-description`;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor={anchor}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        role: "dialog",
        "aria-modal": true,
        "aria-labelledby": drawerTitleId,
        "aria-describedby": description ? drawerDescriptionId : undefined,
        sx: {
          width,
          maxWidth: "100vw",
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 1.5 }}
        >
          <Typography id={drawerTitleId} variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <IconButton
            aria-label="Close drawer"
            onClick={(event) => onClose(event, "escapeKeyDown")}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        {description ? (
          <Typography
            id={drawerDescriptionId}
            color="text.secondary"
            sx={{ mb: 2.5 }}
          >
            {description}
          </Typography>
        ) : null}

        {children}
      </Box>
    </Drawer>
  );
}
