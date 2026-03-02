"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { PropsWithChildren } from "react";
import { AppSnackbarProvider } from "@/components/ui/app-snackbar-provider";
import { appTheme } from "@/theme/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <AppSnackbarProvider>{children}</AppSnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
