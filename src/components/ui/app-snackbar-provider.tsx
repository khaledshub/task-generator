"use client";

import {
  Alert,
  type AlertColor,
  Snackbar,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export interface AppSnackbarOptions {
  severity?: AlertColor;
  autoHideDuration?: number;
}

interface AppSnackbarRequest {
  message: string;
  options?: AppSnackbarOptions;
}

interface AppSnackbarContextValue {
  enqueueSnackbar: (message: string, options?: AppSnackbarOptions) => void;
}

const DEFAULT_AUTO_HIDE_MS = 3000;

const AppSnackbarContext = createContext<AppSnackbarContextValue | undefined>(
  undefined,
);

/**
 * Provides a shared enqueue-style snackbar API for client components.
 */
export function AppSnackbarProvider({ children }: PropsWithChildren) {
  const [, setQueue] = useState<AppSnackbarRequest[]>([]);
  const [activeSnackbar, setActiveSnackbar] = useState<AppSnackbarRequest | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const enqueueSnackbar = useCallback(
    (message: string, options?: AppSnackbarOptions) => {
      const request: AppSnackbarRequest = { message, options };

      if (activeSnackbar) {
        setQueue((previousQueue) => [...previousQueue, request]);
        return;
      }

      setActiveSnackbar(request);
      setOpen(true);
    },
    [activeSnackbar],
  );

  const processNext = useCallback(() => {
    setQueue((previousQueue) => {
      if (previousQueue.length === 0) {
        setActiveSnackbar(null);
        return previousQueue;
      }

      const [next, ...rest] = previousQueue;
      setActiveSnackbar(next);
      setOpen(true);
      return rest;
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleExited = useCallback(() => {
    processNext();
  }, [processNext]);

  const contextValue = useMemo(
    () => ({
      enqueueSnackbar,
    }),
    [enqueueSnackbar],
  );

  return (
    <AppSnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={
          activeSnackbar?.options?.autoHideDuration ?? DEFAULT_AUTO_HIDE_MS
        }
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={activeSnackbar?.options?.severity ?? "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {activeSnackbar?.message}
        </Alert>
      </Snackbar>
    </AppSnackbarContext.Provider>
  );
}

/**
 * Returns the global snackbar enqueue API.
 */
export function useAppSnackbar(): AppSnackbarContextValue {
  const contextValue = useContext(AppSnackbarContext);

  if (!contextValue) {
    throw new Error("useAppSnackbar must be used inside AppSnackbarProvider.");
  }

  return contextValue;
}
