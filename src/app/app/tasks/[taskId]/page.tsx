import { Chip, Divider, Paper, Stack, Typography, Button } from "@mui/material";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { TASK_CONTEXT_LABELS, TASK_ENERGY_LABELS, TASK_TYPE_LABELS } from "@/lib/tasks/config";
import { toStringArray } from "@/lib/tasks/types";
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

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: 2.5,
          background:
            "linear-gradient(130deg, color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent), color-mix(in srgb, var(--mui-palette-background-paper) 92%, white 8%))",
        }}
      >
        <Stack spacing={1.5} alignItems="center" textAlign="center">
          <Typography variant="h5" component="h1" fontWeight={700} textAlign="center">
            {task.title}
          </Typography>

          {task.description ? (
            <Typography color="text.secondary">{task.description}</Typography>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">2-minute starter step</Typography>
          <Typography>{task.starterStep}</Typography>

          <Divider />

          <Typography variant="h6">Checklist</Typography>
          {checklistItems.length === 0 ? (
            <Typography color="text.secondary">No checklist items.</Typography>
          ) : (
            <Stack component="ul" sx={{ m: 0, pl: 3 }}>
              {checklistItems.map((item) => (
                <Typography component="li" key={item}>
                  {item}
                </Typography>
              ))}
            </Stack>
          )}

          <Divider />

          <Typography variant="h6">Tips</Typography>
          {tips.length === 0 ? (
            <Typography color="text.secondary">No tips.</Typography>
          ) : (
            <Stack component="ul" sx={{ m: 0, pl: 3 }}>
              {tips.map((tip) => (
                <Typography component="li" key={tip}>
                  {tip}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <TaskQuickActions taskId={task.id} />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Latest pick history for this task</Typography>
          {events.length === 0 ? (
            <Typography color="text.secondary">No history yet.</Typography>
          ) : (
            events.map((event) => (
              <Stack
                key={event.id}
                spacing={0.5}
                sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.5 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {event.pickedAt.toLocaleString()}
                </Typography>
                <Typography fontWeight={600}>
                  {event.action}
                  {event.skippedReason ? ` (${event.skippedReason})` : ""}
                </Typography>
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
