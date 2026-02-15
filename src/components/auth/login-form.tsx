"use client";

import { Alert, Button, Stack, TextField } from "@mui/material";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successMessage = useMemo(() => {
    if (searchParams.get("registered") === "1") {
      return "Account created. You can now log in.";
    }

    return null;
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setPending(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2}>
        {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
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
        />

        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Logging in..." : "Log in"}
        </Button>
      </Stack>
    </form>
  );
}
