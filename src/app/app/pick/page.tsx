import { Stack } from "@mui/material";
import { requireSessionUserId } from "@/lib/auth/session";
import { PickTaskPanel } from "@/components/picker/pick-task-panel";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";

export default async function PickTaskPage() {
  await requireSessionUserId();

  return (
    <Stack spacing={3}>
      <PagePurposeHeader
        title="Pick my task"
        subtitle="Set your current context and let the weighted picker choose one best next action."
      />

      <PickTaskPanel />
    </Stack>
  );
}
