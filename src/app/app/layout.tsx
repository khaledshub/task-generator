import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { authOptions } from "@/lib/auth/options";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            TodoList RandomGenerator
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button href="/app" color="inherit" variant="text">
              Home
            </Button>
            <Button href="/app/tasks" color="inherit" variant="text">
              Tasks
            </Button>
            <Button href="/app/pick" color="inherit" variant="text">
              Pick
            </Button>
            <Button href="/app/history" color="inherit" variant="text">
              History
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {session.user.email}
          </Typography>
          <LogoutButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
