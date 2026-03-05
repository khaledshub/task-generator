import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import prisma from "@/lib/prisma";

const BOOTSTRAP_PROBE_KEY = "phase1-connectivity";

/**
 * Reads the bootstrap probe row that seed writes during container startup.
 * Returns null when the database is unavailable or the probe has not been seeded.
 */
async function getBootstrapProbe() {
  try {
    return await prisma.bootstrapProbe.findUnique({
      where: { key: BOOTSTRAP_PROBE_KEY },
    });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const probe = await getBootstrapProbe();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            TodoList RandomGenerator
          </Typography>
          <Chip label="Phase 1" color="primary" size="small" />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Paper
            sx={{
              p: 3,
              background:
                "linear-gradient(130deg, color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 92%, white 8%))",
            }}
          >
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Typography variant="h5" component="h1" fontWeight={700} textAlign="center">
                Monolith bootstrap is running
              </Typography>
              <Typography color="text.secondary">
                This starter includes Next.js App Router, MUI, Prisma, and
                Postgres wiring with credentials authentication for the
                TodoList RandomGenerator app.
              </Typography>

              {probe ? (
                <Alert severity="success">
                  Prisma connectivity probe found: <strong>{probe.key}</strong> at{" "}
                  {new Date(probe.updatedAt).toLocaleString()}
                </Alert>
              ) : (
                <Alert severity="warning">
                  Connectivity probe not found yet. Run <code>npm run db:seed</code>
                  after migrations.
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button href="/signup" variant="contained">
                  Create account
                </Button>
                <Button href="/login" variant="outlined">
                  Log in
                </Button>
                <Button href="/" variant="text">
                  Refresh status
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
