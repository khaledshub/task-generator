import {
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  PickAction,
  TaskContext,
  TaskEnergy,
  TaskFrequency,
  TaskType,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import {
  TASK_CONTEXT_LABELS,
  TASK_ENERGY_LABELS,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/config";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";

interface HistoryPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    limit?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const userId = await requireSessionUserId();
  const { from, to, limit } = await searchParams;

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const parsedLimit = parseLimit(limit);

  const [tasks, totalTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate ?? undefined,
          lte: toDate ? endOfDay(toDate) : undefined,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parsedLimit,
      select: {
        id: true,
        createdAt: true,
        isArchived: true,
        title: true,
        description: true,
        context: true,
        energy: true,
        type: true,
        frequency: true,
        timeEstimateMinutes: true,
      },
    }),
    prisma.task.count({
      where: {
        userId,
        createdAt: {
          gte: fromDate ?? undefined,
          lte: toDate ? endOfDay(toDate) : undefined,
        },
      },
    }),
  ]);

  const nextLimit = getNextLimit(parsedLimit);
  const hasMore = totalTasks > parsedLimit && parsedLimit < 20;
  const showCount = Math.min(parsedLimit, totalTasks);
  const queryBase = new URLSearchParams();

  if (from) {
    queryBase.set("from", from);
  }

  if (to) {
    queryBase.set("to", to);
  }

  const showMoreHref =
    nextLimit === null
      ? null
      : `/app/history?${new URLSearchParams({
          ...Object.fromEntries(queryBase.entries()),
          limit: String(nextLimit),
        }).toString()}`;

  const events = await prisma.pickEvent.findMany({
    where: {
      userId,
      pickedAt: {
        gte: fromDate ?? undefined,
        lte: toDate ? endOfDay(toDate) : undefined,
      },
    },
    include: {
      task: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      pickedAt: "desc",
    },
    take: 20,
  });

  return (
    <Stack spacing={3}>
      <PagePurposeHeader
        title="History"
        subtitle="Review task timeline and status events to track momentum and outcomes."
      />

      <Paper sx={{ p: 3 }}>
        <Stack
          component="form"
          action="/app/history"
          method="get"
          spacing={2}
          direction={{ xs: "column", sm: "row" }}
        >
          <TextField
            label="From"
            type="date"
            defaultValue={from ?? ""}
            name="from"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To"
            type="date"
            defaultValue={to ?? ""}
            name="to"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="outlined">
            Filter
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">
            Task history ({showCount} of {totalTasks})
          </Typography>

          {tasks.length === 0 ? (
            <Typography color="text.secondary">No tasks found.</Typography>
          ) : (
            <>
              {tasks.map((task) => (
                <Stack
                  key={task.id}
                  spacing={0.75}
                  sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      {task.createdAt.toLocaleString()}
                    </Typography>
                    {task.isArchived ? (
                      <Chip size="small" color="warning" label="Archived" />
                    ) : (
                      <Chip size="small" color="success" label="Active" />
                    )}
                  </Stack>

                  <Typography fontWeight={600}>{task.title}</Typography>
                  {task.description ? (
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                  ) : null}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={`Context: ${TASK_CONTEXT_LABELS[task.context as TaskContext]}`}
                    />
                    <Chip
                      size="small"
                      label={`Energy: ${TASK_ENERGY_LABELS[task.energy as TaskEnergy]}`}
                    />
                    <Chip
                      size="small"
                      label={`Type: ${TASK_TYPE_LABELS[task.type as TaskType]}`}
                    />
                    <Chip
                      size="small"
                      label={`Frequency: ${TASK_FREQUENCY_LABELS[task.frequency as TaskFrequency]}`}
                    />
                    <Chip size="small" label={`${task.timeEstimateMinutes} min`} />
                  </Stack>
                </Stack>
              ))}

              {hasMore && showMoreHref ? (
                <Button variant="outlined" href={showMoreHref} sx={{ alignSelf: "flex-start" }}>
                  Show more
                </Button>
              ) : null}
            </>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Recent events ({events.length})</Typography>

          {events.length === 0 ? (
            <Typography color="text.secondary">No events found.</Typography>
          ) : (
            events.map((event) => (
              <Stack
                key={event.id}
                spacing={0.75}
                sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    size="small"
                    label={event.action}
                    color={event.action === PickAction.DONE ? "success" : "default"}
                  />
                  {event.skippedReason ? (
                    <Chip size="small" color="warning" label={event.skippedReason} />
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    {event.pickedAt.toLocaleString()}
                  </Typography>
                </Stack>

                <Typography fontWeight={600}>{event.task.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.why}
                </Typography>
                {event.notes ? (
                  <Typography variant="body2">Notes: {event.notes}</Typography>
                ) : null}
              </Stack>
            ))
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseLimit(value?: string): 5 | 10 | 20 {
  if (value === "10") {
    return 10;
  }

  if (value === "20") {
    return 20;
  }

  return 5;
}

function getNextLimit(current: 5 | 10 | 20): 10 | 20 | null {
  if (current === 5) {
    return 10;
  }

  if (current === 10) {
    return 20;
  }

  return null;
}
