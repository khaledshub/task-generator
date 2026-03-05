"use client";

import { Alert, Button, Stack, TextField } from "@mui/material";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const successMessage = useMemo(() => {
    if (searchParams.get("reset") === "1") {
      return "Password reset complete. You can now log in.";
    }

    if (searchParams.get("registered") === "1") {
      return "Account created. You can now log in.";
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery && email.length === 0) {
      setEmail(emailFromQuery);
    }
  }, [searchParams, email.length]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/app";
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || !result.ok || result.error) {
        setError("Invalid email or password.");
        return;
      }

      const targetUrl =
        result.url && !result.url.includes("/login") ? result.url : callbackUrl;

      window.location.assign(targetUrl);
    } catch {
      setError("Could not log in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate style={{ width: "100%" }}>
      <Stack spacing={2}>
        {successMessage ? (
          <Alert severity="success" sx={{ wordBreak: "break-word" }}>
            {successMessage}
          </Alert>
        ) : null}
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
          onBlur={() => setEmailTouched(true)}
          onChange={(event) => setEmail(event.target.value)}
          error={emailTouched && email.trim().length > 0 && !email.includes("@")}
        />

        <TextField
          required
          fullWidth
          type="password"
          label="Password"
          slotProps={{ inputLabel: { shrink: true } }}
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={pending || email.trim().length === 0 || password.length === 0}
          fullWidth
        >
          {pending ? "Logging in..." : "Log in"}
        </Button>

        <Button href="/forgot-password" variant="text" size="small" sx={{ alignSelf: "flex-end" }}>
          Forgot password?
        </Button>
      </Stack>
    </form>
  );
}
