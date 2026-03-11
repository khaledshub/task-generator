import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { HomeCreateTaskSpotlight } from "@/components/tasks/home-create-task-spotlight";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";
import {
  TASK_CONTEXT_LABELS,
  TASK_ENERGY_LABELS,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/config";
import { toStringArray } from "@/lib/tasks/types";
import { archiveTaskAction } from "./actions";

export default async function TasksPage() {
  const userId = await requireSessionUserId();

  const [activeTasks, archivedTasks] = await Promise.all([
    prisma.task.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        context: true,
        energy: true,
        type: true,
        frequency: true,
        timeEstimateMinutes: true,
        avoiding: true,
        starterStep: true,
        checklistItems: true,
        tips: true,
      },
    }),
    prisma.task.findMany({
      where: { userId, isArchived: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  return (
    <Stack spacing={3}>
      <PagePurposeHeader
        title="Tasks"
        subtitle="Build your task pool so the picker can select the best next action for your context."
      />

      <HomeCreateTaskSpotlight
        title="Task command center"
        description="Create a task in-place without leaving this page. Saved tasks are linked to your account and available across sessions."
        buttonLabel="New task modal"
        showEnhancements
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2" fontWeight={700}>
            Active tasks ({activeTasks.length})
          </Typography>

          {activeTasks.length === 0 ? (
            <Typography color="text.secondary">
              No tasks yet. Create your first task above.
            </Typography>
          ) : (
            activeTasks.map((task) => {
              const checklistCount = toStringArray(task.checklistItems).length;
              const tipsCount = toStringArray(task.tips).length;

              return (
                <Box key={task.id}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6">{task.title}</Typography>
                    {task.description ? (
                      <Typography color="text.secondary">
                        {task.description}
                      </Typography>
                    ) : null}

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        label={`Context: ${TASK_CONTEXT_LABELS[task.context]}`}
                      />
                      <Chip
                        size="small"
                        label={`Energy: ${TASK_ENERGY_LABELS[task.energy]}`}
                      />
                      <Chip
                        size="small"
                        label={`Type: ${TASK_TYPE_LABELS[task.type]}`}
                      />
                      <Chip
                        size="small"
                        label={`Frequency: ${TASK_FREQUENCY_LABELS[task.frequency]}`}
                      />
                      <Chip
                        size="small"
                        label={`${task.timeEstimateMinutes} min`}
                      />
                      {task.avoiding ? (
                        <Chip size="small" color="warning" label="Avoiding" />
                      ) : null}
                      <Chip size="small" label={`Checklist: ${checklistCount}`} />
                      <Chip size="small" label={`Tips: ${tipsCount}`} />
                    </Stack>

                    <Typography variant="body2">
                      Starter step: <strong>{task.starterStep}</strong>
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <Button
                        href={`/app/tasks/${task.id}`}
                        variant="outlined"
                        size="small"
                      >
                        View
                      </Button>

                      <Button
                        href={`/app/tasks/${task.id}/edit`}
                        variant="outlined"
                        size="small"
                      >
                        Edit
                      </Button>

                      <form action={archiveTaskAction.bind(null, task.id)}>
                        <Button type="submit" color="warning" size="small">
                          Archive
                        </Button>
                      </form>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                </Box>
              );
            })
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h6">Recently archived</Typography>
          {archivedTasks.length === 0 ? (
            <Typography color="text.secondary">No archived tasks yet.</Typography>
          ) : (
            archivedTasks.map((task) => (
              <Typography key={task.id} color="text.secondary">
                {task.title}
              </Typography>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
