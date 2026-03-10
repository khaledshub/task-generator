"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";

export function JoinAsGuestSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onContinueAsGuest() {
    setIsPending(true);
    setError(null);

    try {
      const result = await signIn("guest", {
        redirect: false,
        callbackUrl: "/app",
      });

      if (!result || !result.ok || result.error) {
        setError("Could not start guest session. Please try again.");
        return;
      }

      document.cookie = "tg_guest_browser=1; path=/; SameSite=Lax";
      const targetUrl =
        result.url && !result.url.includes("/login") ? result.url : "/app";
      window.location.assign(targetUrl);
    } catch {
      setError("Could not start guest session. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Button variant="outlined" color="info" onClick={() => setIsOpen(true)}>
        Join as Guest
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Continue as Guest?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Typography color="text.secondary">
              If you continue as guest, all saved tasks and data will be lost when
              the page is closed.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              disabled={isPending}
              onClick={() => void onContinueAsGuest()}
            >
              {isPending ? "Starting guest session..." : "Continue as Guest"}
            </Button>
            <Typography variant="body2" color="text.secondary">
              To save tasks/data{" "}
              <MuiLink
                component={Link}
                href="/login"
                color="primary.main"
                sx={{ textDecoration: "underline", fontWeight: 600 }}
              >
                login
              </MuiLink>{" "}
              or{" "}
              <MuiLink
                component={Link}
                href="/signup"
                color="primary.main"
                sx={{ textDecoration: "underline", fontWeight: 600 }}
              >
                create account
              </MuiLink>
              .
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)} disabled={isPending}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
