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

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, confirmPassword }),
    });

    const data = (await response.json().catch(() => ({}))) as SignupResponse;

    if (!response.ok) {
      setError(data.error ?? "Unable to create account.");
      setPending(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          required
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          required
          type="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          helperText="Use at least 8 characters"
        />

        <TextField
          required
          type="password"
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </Stack>
    </form>
  );
}
