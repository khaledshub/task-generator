"use client";

import { Alert, Button, Stack, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface SignupResponse {
  error?: string;
}

export function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as SignupResponse;

      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }

      router.push(`/login?registered=1&email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ width: "100%" }}>
      <Stack spacing={2}>
        {error ? (
          <Alert severity="error" sx={{ wordBreak: "break-word" }}>
            {error}
          </Alert>
        ) : null}

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

        <TextField
          required
          fullWidth
          type="password"
          label="Password"
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
          label="Confirm password"
          slotProps={{ inputLabel: { shrink: true } }}
          value={confirmPassword}
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={
            pending ||
            email.trim().length === 0 ||
            password.length === 0 ||
            confirmPassword.length === 0
          }
          fullWidth
        >
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </Stack>
    </form>
  );
}
