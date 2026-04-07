"use client";

import { AppBar, Box } from "@mui/material";
import type { PropsWithChildren } from "react";
import { getNavChromeSx } from "@/theme/patterns";

interface HeaderFrameProps extends PropsWithChildren {
  hidden?: boolean;
}

export function HeaderFrame({ children, hidden = false }: HeaderFrameProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        bgcolor: "transparent",
        border: "none",
        boxShadow: "none",
        px: { xs: 1, sm: 2, md: 3 },
        pt: { xs: 1, sm: 1.5 },
        transition: `transform ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}, opacity ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}`,
        transform: hidden ? "translateY(-130%)" : "translateY(0)",
        opacity: hidden ? 0 : 1,
      })}
    >
      <Box sx={(theme) => getNavChromeSx(theme)}>{children}</Box>
    </AppBar>
  );
}
