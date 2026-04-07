import { Button, Paper, Stack, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { TaskForm } from "@/components/tasks/task-form";
import { mapTaskToFormValues } from "@/lib/tasks/types";
import { updateTaskAction } from "../../actions";

interface EditTaskPageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const userId = await requireSessionUserId();
  const { taskId } = await params;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      frequency: true,
      context: true,
      type: true,
      energy: true,
      timeEstimateMinutes: true,
      avoiding: true,
      generateAiStepsEnabled: true,
      aiProvider: true,
      starterStep: true,
      checklistItems: true,
      tips: true,
    },
  });

  if (!task) {
    notFound();
  }

  const updateAction = updateTaskAction.bind(null, task.id);

  return (
    <Stack spacing={3.5}>
      <Paper
        sx={{
          p: { xs: 3, sm: 3.5, lg: 4 },
          borderRadius: 6,
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--mui-palette-secondary-main) 12%, transparent), transparent 28%), linear-gradient(130deg, color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 92%, white 8%))",
        }}
      >
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "secondary.main" }}>
            Edit workflow
          </Typography>
          <Typography variant="h3" component="h1" fontWeight={800}>
            Edit task
          </Typography>
          <Typography color="text.secondary">{task.title}</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: "flex-start" }}>
            <Button href="/app/tasks" variant="text">
              Back to tasks
            </Button>
            <Button href={`/app/tasks/${task.id}`} variant="outlined">
              Cancel edit
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3.25 } }}>
        <TaskForm
          action={updateAction}
          initialValues={mapTaskToFormValues(task)}
          submitLabel="Save changes"
        />
      </Paper>
    </Stack>
  );
}
