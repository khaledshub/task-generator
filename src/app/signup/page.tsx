import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { authOptions } from "@/lib/auth/options";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/app");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Create account
          </Typography>

          <SignupForm />

          <Button href="/login" variant="text">
            Already have an account? Log in
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
