"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { PaletteMode } from "@mui/material";
import type { PropsWithChildren } from "react";
import { ThemeModeProvider } from "@/components/theme/theme-mode-provider";
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";
import { AppSnackbarProvider } from "@/components/ui/app-snackbar-provider";

interface AppProvidersProps extends PropsWithChildren {
  initialMode?: PaletteMode;
}

export function AppProviders({ children, initialMode = "dark" }: AppProvidersProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeModeProvider initialMode={initialMode}>
        <AppSnackbarProvider>{children}</AppSnackbarProvider>
        <ThemeModeToggle />
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
