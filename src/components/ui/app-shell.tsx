"use client";

import { Box } from "@mui/material";
import type { PropsWithChildren, ReactNode } from "react";

interface AppShellProps extends PropsWithChildren {
  header?: ReactNode;
  contentWidth?: "narrow" | "content" | "wide";
  fullBleed?: boolean;
}

export function AppShell({
  children,
  header,
  contentWidth = "content",
  fullBleed = false,
}: AppShellProps) {
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100svh",
        bgcolor: "transparent",
        backgroundImage: theme.app.gradient.canvas,
      })}
    >
      {header}
      <Box
        component="main"
        sx={(theme) => ({
          width: "100%",
          px: fullBleed ? 0 : theme.app.spacing.shellX,
          py: fullBleed ? 0 : { xs: 2.5, sm: 3.5, lg: 4.5 },
          pb: fullBleed ? 0 : { xs: 4, sm: 5, lg: 6 },
          maxWidth: fullBleed ? "none" : theme.app.contentWidth[contentWidth],
          mx: fullBleed ? undefined : "auto",
        })}
      >
        {children}
      </Box>
    </Box>
  );
}
