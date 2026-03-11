import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { PublicHeader } from "@/components/navigation/public-header";
import { isGuestEmail } from "@/lib/auth/guest";
import { authOptions } from "@/lib/auth/options";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user && !isGuestEmail(session.user.email)) {
    redirect("/app");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicHeader />
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
              Log in
            </Typography>

            <LoginForm />

            <Button href="/signup" variant="text">
              Need an account? Sign up
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
