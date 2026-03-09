"use client";

import { useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { useAppSnackbar } from "@/components/ui/app-snackbar-provider";

/**
 * Captures current and next password values and submits an authenticated update request.
 */
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enqueueSnackbar } = useAppSnackbar();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      enqueueSnackbar(result.message ?? "Password updated.", { severity: "success" });
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Password update failed.",
        { severity: "error" },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      <TextField
        label="Current password"
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
        fullWidth
        autoComplete="current-password"
      />
      <TextField
        label="New password"
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        helperText="Use at least 8 characters with uppercase, lowercase, number, and symbol."
      />
      <TextField
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        fullWidth
        autoComplete="new-password"
      />
      <Button type="submit" variant="contained" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Change password"}
      </Button>
    </Stack>
  );
}
