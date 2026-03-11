"use client";

import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";

interface ForgotPasswordResponse {
  message?: string;
  resetUrl?: string;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = (await response.json().catch(() => ({}))) as ForgotPasswordResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not process request.");
        return;
      }

      setMessage(data.message ?? "If an account exists for this email, a reset link was generated.");
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch {
      setError("Could not process request.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ width: "100%" }}>
      <Stack spacing={2}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          required
          fullWidth
          type="email"
          label="Email"
          slotProps={{ inputLabel: { shrink: true } }}
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
        />

        {resetUrl ? (
          <Alert severity="info">
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              Dev reset link: <a href={resetUrl}>{resetUrl}</a>
            </Typography>
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={pending || email.trim().length === 0}
        >
          {pending ? "Generating link..." : "Send reset link"}
        </Button>
      </Stack>
    </form>
  );
}
