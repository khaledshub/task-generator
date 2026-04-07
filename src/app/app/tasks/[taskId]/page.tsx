import { Alert, Button, Chip, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material";
import { PickAction } from "@prisma/client";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import {
  getAiPendingStaleMessage,
  getTaskAiStatusSnapshot,
} from "@/lib/tasks/ai-lifecycle";
import { TASK_CONTEXT_LABELS, TASK_ENERGY_LABELS, TASK_TYPE_LABELS } from "@/lib/tasks/config";
import { toStringArray } from "@/lib/tasks/types";
import { Checklist } from "@/components/tasks/checklist";
import { TaskAiPendingWatcher } from "@/components/tasks/task-ai-pending-watcher";
import { TaskTipsAssistant } from "@/components/tasks/task-tips-assistant";
import { TaskQuickActions } from "@/components/tasks/task-quick-actions";

interface TaskDetailPageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const userId = await requireSessionUserId();
  const { taskId } = await params;

  const [task, events] = await Promise.all([
    prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        context: true,
        type: true,
        energy: true,
        timeEstimateMinutes: true,
        starterStep: true,
        checklistItems: true,
        tips: true,
        generateAiStepsEnabled: true,
        aiStepsGenerationStatus: true,
        aiProvider: true,
        isArchived: true,
        updatedAt: true,
      },
    }),
    prisma.pickEvent.findMany({
      where: {
        taskId,
        userId,
      },
      orderBy: {
        pickedAt: "desc",
      },
      take: 20,
    }),
  ]);

  if (!task) {
    notFound();
  }

  const checklistItems = toStringArray(task.checklistItems);
  const tips = toStringArray(task.tips);
  const aiStatusSnapshot = getTaskAiStatusSnapshot(
    task.aiStepsGenerationStatus,
    task.updatedAt,
  );
  const isChecklistGenerating =
    task.generateAiStepsEnabled && aiStatusSnapshot.isPending;
  const isChecklistGenerationStale = aiStatusSnapshot.isStalePending;
  const checklistItemsForTracking =
    checklistItems.length > 0
      ? checklistItems
      : task.generateAiStepsEnabled
        ? []
        : [task.starterStep];

  return (
    <Stack spacing={3.5}>
      <TaskAiPendingWatcher isPending={isChecklistGenerating && !isChecklistGenerationStale} />
      <Paper
        sx={{
          p: { xs: 3, sm: 3.5, lg: 4 },
          borderRadius: 6,
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--mui-palette-secondary-main) 12%, transparent), transparent 28%), linear-gradient(130deg, color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 92%, white 8%))",
        }}
      >
        <Stack spacing={1.75} alignItems="flex-start">
          <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "secondary.main" }}>
            Task detail
          </Typography>
          <Typography variant="h3" component="h1" fontWeight={800}>
            {task.title}
          </Typography>

          {task.description ? (
            <Typography color="text.secondary" sx={{ maxWidth: 820 }}>
              {task.description}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={task.isArchived ? "warning" : "success"}
              label={task.isArchived ? "Archived" : "Active"}
              variant="filled"
              sx={
                task.isArchived
                  ? undefined
                  : {
                      bgcolor: "success.main",
                      color: "success.contrastText",
                    }
              }
            />
            <Chip size="small" label={`Context: ${TASK_CONTEXT_LABELS[task.context]}`} />
            <Chip size="small" label={`Type: ${TASK_TYPE_LABELS[task.type]}`} />
            <Chip size="small" label={`Energy: ${TASK_ENERGY_LABELS[task.energy]}`} />
            <Chip size="small" label={`${task.timeEstimateMinutes} min`} />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href="/app/tasks" variant="text">
              Back to tasks
            </Button>
            <Button href={`/app/tasks/${task.id}/edit`} variant="outlined">
              Edit task
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">2-minute starter step</Typography>
          <Typography>{task.starterStep}</Typography>

          <Divider />

          <Typography variant="h6">Checklist</Typography>
          {isChecklistGenerationStale ? (
            <Stack spacing={1}>
              <Alert severity="warning">
                {getAiPendingStaleMessage()}
              </Alert>
              <Typography color="text.secondary">
                The task is still available. You can work from the starter step below while AI checklist recovery is pending.
              </Typography>
            </Stack>
          ) : isChecklistGenerating ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography color="text.secondary">
                Generating GenAI checklist... your checkboxes will appear shortly.
              </Typography>
            </Stack>
          ) : (
            <Checklist
              key={`task-checklist:${task.id}`}
              items={checklistItemsForTracking}
              emptyMessage="No checklist items."
              storageKey={`task-checklist:${task.id}`}
            />
          )}

          <Divider />

          <Typography variant="h6">Tips</Typography>
          <TaskTipsAssistant
            taskId={task.id}
            title={task.title}
            description={task.description}
            starterStep={task.starterStep}
            aiProvider={task.aiProvider}
            initialTips={tips}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
        <TaskQuickActions taskId={task.id} />
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Latest pick history for this task</Typography>
          {events.length === 0 ? (
            <Typography color="text.secondary">No history yet.</Typography>
          ) : (
            events.map((event) => (
              <Stack
                key={event.id}
                spacing={0.75}
                sx={{
                  borderRadius: 4,
                  px: { xs: 1.5, sm: 2 },
                  py: 1.75,
                  bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {event.pickedAt.toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    size="small"
                    color={toEventChipColor(event.action)}
                    label={event.action}
                    variant="filled"
                    sx={
                      event.action === PickAction.PICKED
                        ? {
                            bgcolor: "info.main",
                            color: "info.contrastText",
                          }
                        : undefined
                    }
                  />
                  {event.skippedReason ? (
                    <Chip size="small" color="warning" label={event.skippedReason} />
                  ) : null}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {event.why}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function toEventChipColor(action: PickAction): "info" | "primary" | "success" | "warning" {
  if (action === PickAction.PICKED) {
    return "info";
  }

  if (action === PickAction.STARTED) {
    return "primary";
  }

  if (action === PickAction.DONE) {
    return "success";
  }

  return "warning";
}
