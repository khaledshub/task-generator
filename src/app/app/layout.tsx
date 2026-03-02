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
    <Box sx={{ minHeight: "100vh", bgcolor: "transparent" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "rgba(248, 255, 252, 0.82)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "rgba(15, 118, 110, 0.15)",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            TodoList RandomGenerator
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button href="/app" color="inherit" variant="outlined" size="small">
              Home
            </Button>
            <Button href="/app/tasks" color="inherit" variant="outlined" size="small">
              Tasks
            </Button>
            <Button href="/app/pick" color="inherit" variant="outlined" size="small">
              Pick
            </Button>
            <Button href="/app/history" color="inherit" variant="outlined" size="small">
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
