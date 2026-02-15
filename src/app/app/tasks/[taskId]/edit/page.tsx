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
  });

  if (!task) {
    notFound();
  }

  const updateAction = updateTaskAction.bind(null, task.id);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Edit task
          </Typography>
          <Typography color="text.secondary">{task.title}</Typography>
          <Button href="/app/tasks" variant="text" sx={{ alignSelf: "flex-start" }}>
            Back to tasks
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <TaskForm
          action={updateAction}
          initialValues={mapTaskToFormValues(task)}
          submitLabel="Save changes"
        />
      </Paper>
    </Stack>
  );
}
