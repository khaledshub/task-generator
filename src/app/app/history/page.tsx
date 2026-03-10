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

      <Paper
        sx={{
          p: 3,
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.26)",
          background:
            "linear-gradient(120deg, rgba(30,64,175,0.96), rgba(37,99,235,0.92), rgba(14,165,233,0.88))",
          color: "common.white",
          boxShadow: "0 22px 40px rgba(29,78,216,0.34)",
          transition: "transform 220ms ease, box-shadow 220ms ease",
          "@keyframes historyFilterGlowPulse": {
            "0%": { opacity: 0.42, transform: "scale(0.96)" },
            "50%": { opacity: 0.7, transform: "scale(1.03)" },
            "100%": { opacity: 0.42, transform: "scale(0.96)" },
          },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "-22%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(191,219,254,0.25), rgba(125,211,252,0.2), transparent 66%)",
            pointerEvents: "none",
            animation: "historyFilterGlowPulse 4.5s ease-in-out infinite",
          },
          "&:hover": {
            transform: "translateY(-3px) scale(1.01)",
            boxShadow: "0 28px 52px rgba(29,78,216,0.42)",
          },
        }}
      >
        <Stack
          component="form"
          action="/app/history"
          method="get"
          spacing={2}
          direction={{ xs: "column", sm: "row" }}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <TextField
            label="From"
            type="date"
            defaultValue={from ?? ""}
            name="from"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={historyFilterFieldSx}
          />
          <TextField
            label="To"
            type="date"
            defaultValue={to ?? ""}
            name="to"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={historyFilterFieldSx}
          />
          <Button
            type="submit"
            variant="outlined"
            sx={{
              color: "common.white",
              borderColor: "rgba(255,255,255,0.45)",
              fontWeight: 700,
              "&:hover": {
                borderColor: "rgba(255,255,255,0.7)",
                bgcolor: "rgba(255,255,255,0.12)",
              },
            }}
          >
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
                    color={toEventChipColor(event.action)}
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

const historyFilterFieldSx = {
  minWidth: { xs: "100%", sm: 180 },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.82)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "common.white" },
  "& .MuiInputBase-input": { color: "common.white" },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.35)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.6)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.8)",
  },
};
