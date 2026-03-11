"use client";

import { Alert, Button, Stack, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface ResetPasswordResponse {
  message?: string;
  error?: string;
}

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as ResetPasswordResponse;

      if (!response.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }

      setSuccess(data.message ?? "Password updated.");
      setTimeout(() => {
        router.push("/login?reset=1");
      }, 800);
    } catch {
      setError("Could not reset password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ width: "100%" }}>
      <Stack spacing={2}>
        {success ? <Alert severity="success">{success}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          required
          fullWidth
          type="password"
          label="New password"
          slotProps={{ inputLabel: { shrink: true } }}
          value={password}
          autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)}
          helperText="Use 8+ chars with uppercase, lowercase, number, and symbol."
        />

        <TextField
          required
          fullWidth
          type="password"
          label="Confirm new password"
          slotProps={{ inputLabel: { shrink: true } }}
          value={confirmPassword}
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={
            pending || password.length === 0 || confirmPassword.length === 0
          }
        >
          {pending ? "Resetting..." : "Reset password"}
        </Button>
      </Stack>
    </form>
  );
}
