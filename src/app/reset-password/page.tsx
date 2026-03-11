import { Alert, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { authOptions } from "@/lib/auth/options";

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/app");
  }

  const resolvedParams = await searchParams;
  const tokenValue = resolvedParams.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
      <Paper
        sx={{
          p: { xs: 2.5, sm: 4 },
          maxWidth: "100%",
          overflow: "hidden",
          background:
            "linear-gradient(130deg, color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 92%, white 8%))",
        }}
      >
        <Stack spacing={2.25} alignItems="center" textAlign="center">
          <Typography variant="h5" component="h1" fontWeight={700} textAlign="center">
            Reset password
          </Typography>

          {!token ? (
            <>
              <Alert severity="error">Reset link is missing or invalid.</Alert>
              <Button href="/forgot-password" variant="contained">
                Request new link
              </Button>
            </>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
