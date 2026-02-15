import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

export default function AppHomePage() {
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Welcome to your workspace
          </Typography>
          <Typography color="text.secondary">
            Auth is active. Task management, picker logic, and history will be
              added in the next phases.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href="/app/tasks" variant="contained">
              Open tasks
            </Button>
            <Button href="/app/pick" variant="outlined">
              Pick my task
            </Button>
            <Button href="/app/history" variant="text">
              View history
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Tasks</Typography>
          <Typography color="text.secondary">Coming in Phase 3.</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Pick my task</Typography>
          <Typography color="text.secondary">Coming in Phase 4.</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">History</Typography>
          <Typography color="text.secondary">Coming in Phase 4.</Typography>
        </Paper>
      </Stack>

      <Alert severity="info">
        You are authenticated. Protected routes now require a valid session.
      </Alert>
    </Stack>
  );
}
