import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { HomeCreateTaskSpotlight } from "@/components/tasks/home-create-task-spotlight";
import {
  ArchivedStatusChip,
  TaskRowActions,
} from "@/components/tasks/task-row-actions";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";
import {
  TASK_CONTEXT_LABELS,
  TASK_ENERGY_LABELS,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/config";
import { toStringArray } from "@/lib/tasks/types";

interface TasksPageProps {
  searchParams: Promise<{
    focusTask?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const userId = await requireSessionUserId();
  const { focusTask } = await searchParams;
  const focusedTaskId = focusTask?.trim() || null;

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
        buttonLabel="Create Task"
        showEnhancements
        showProductivityTipsButton={false}
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2" fontWeight={700}>
            Active tasks ({activeTasks.length})
          </Typography>

          {focusedTaskId ? (
            <Alert severity="success">
              New task is highlighted below. Open it to continue working.
            </Alert>
          ) : null}

          {activeTasks.length === 0 ? (
            <Typography color="text.secondary">
              No tasks yet. Create your first task above.
            </Typography>
          ) : (
            activeTasks.map((task) => {
              const checklistCount = toStringArray(task.checklistItems).length;
              const tipsCount = toStringArray(task.tips).length;
              const isFocusedTask = focusedTaskId === task.id;

              return (
                <Box
                  key={task.id}
                  id={`task-${task.id}`}
                  sx={
                    isFocusedTask
                      ? {
                          scrollMarginTop: 96,
                          p: 1.5,
                          borderRadius: 2,
                          border: "2px solid",
                          borderColor: "primary.main",
                          background:
                            "linear-gradient(140deg, color-mix(in srgb, var(--mui-palette-primary-main) 14%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 95%, white 5%))",
                        }
                      : undefined
                  }
                >
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
                        label="Active"
                        variant="filled"
                        sx={{
                          bgcolor: "success.main",
                          color: "success.contrastText",
                        }}
                      />
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
                      {isFocusedTask ? (
                        <Chip size="small" color="primary" label="Just created" />
                      ) : null}
                      <Chip size="small" label={`Checklist: ${checklistCount}`} />
                      <Chip size="small" label={`Tips: ${tipsCount}`} />
                    </Stack>

                    <Typography variant="body2">
                      Starter step: <strong>{task.starterStep}</strong>
                    </Typography>

                    <TaskRowActions taskId={task.id} />
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
              <Stack key={task.id} direction="row" spacing={1} alignItems="center">
                <ArchivedStatusChip taskId={task.id} />
                <Typography color="text.secondary">{task.title}</Typography>
              </Stack>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
