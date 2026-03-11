"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { createAppTheme } from "@/theme/theme";

const THEME_MODE_STORAGE_KEY = "taskgen-theme-mode";

interface ThemeModeContextValue {
  mode: PaletteMode;
  setMode: (mode: PaletteMode) => void;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

interface ThemeModeProviderProps extends PropsWithChildren {
  initialMode?: PaletteMode;
}

export function ThemeModeProvider({
  children,
  initialMode = "dark",
}: ThemeModeProviderProps) {
  const [mode, setModeState] = useState<PaletteMode>(() => {
    if (typeof window === "undefined") {
      return initialMode;
    }

    const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);

    if (storedMode === "light" || storedMode === "dark") {
      return storedMode;
    }

    const datasetMode = document.documentElement.dataset.theme;
    if (datasetMode === "light" || datasetMode === "dark") {
      return datasetMode;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : initialMode;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
    document.cookie = `taskgen-theme-mode=${mode}; path=/; max-age=31536000; samesite=lax`;
  }, [mode]);

  const contextValue = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      setMode: (nextMode) => setModeState(nextMode),
      toggleMode: () =>
        setModeState((currentMode) => (currentMode === "light" ? "dark" : "light")),
    }),
    [mode],
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider.");
  }

  return context;
}
