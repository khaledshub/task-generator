import { Paper, Stack, Typography } from "@mui/material";
import { requireSessionUserId } from "@/lib/auth/session";
import { PickTaskPanel } from "@/components/picker/pick-task-panel";

export default async function PickTaskPage() {
  await requireSessionUserId();

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Pick my task
          </Typography>
          <Typography color="text.secondary">
            Tell us how you feel today and get one weighted-random next action.
          </Typography>
        </Stack>
      </Paper>

      <PickTaskPanel />
    </Stack>
  );
}
