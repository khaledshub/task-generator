import {
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PickAction } from "@prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { ListSection } from "@/components/ui/list-section";
import { PagePurposeHeader } from "@/components/ui/page-purpose-header";
import { requireSessionUserId } from "@/lib/auth/session";
import {
  TASK_CONTEXT_LABELS,
  TASK_ENERGY_LABELS,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/config";
import { getTaskHistoryPageData } from "@/lib/tasks/queries";
import { getInvertedFieldSx } from "@/theme/patterns";

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
  const { tasks, totalTasks, events } = await getTaskHistoryPageData({
    userId,
    fromDate,
    toDate,
    limit: parsedLimit,
  });

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

  return (
    <Stack spacing={3.5}>
      <PagePurposeHeader
        title="History"
        subtitle="Review task timeline and status events to track momentum and outcomes."
        panelSx={{
          borderRadius: { xs: 6, md: 999 },
        }}
        contentSx={{
          px: { xs: 0.4, sm: 0.75, lg: 1.15 },
          py: { xs: 0.45, sm: 0.6 },
        }}
      />

      <FilterToolbar
        title="Filter timeline"
        description="Limit the view by date range to inspect recent execution patterns."
        formAction="/app/history"
        panelSx={{
          borderRadius: { xs: 6, md: 999 },
        }}
        formSx={{
          px: { xs: 0.5, sm: 0.8, lg: 1.1 },
          py: { xs: 0.35, sm: 0.5 },
        }}
        fieldsSx={{
          alignItems: { xs: "stretch", md: "center" },
        }}
        actions={
          <Button
            type="submit"
            variant="outlined"
            sx={{
              color: "common.white",
              borderColor: "rgba(255,255,255,0.45)",
              fontWeight: 700,
              minWidth: { xs: "100%", md: 112 },
              alignSelf: { xs: "stretch", md: "center" },
              "&:hover": {
                borderColor: "rgba(255,255,255,0.7)",
                bgcolor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            Filter
          </Button>
        }
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
      </FilterToolbar>

      <ListSection
        title={`Task history (${showCount} of ${totalTasks})`}
        subtitle="Every task creation in the selected range, ordered newest first."
        panelSx={{
          borderRadius: { xs: 7, md: 999 },
        }}
        contentSx={{
          px: { xs: 0.65, sm: 1, lg: 1.35 },
          py: { xs: 0.4, sm: 0.6 },
        }}
        actions={
          hasMore && showMoreHref ? (
            <Button variant="outlined" href={showMoreHref}>
              Show more
            </Button>
          ) : undefined
        }
      >
        <Stack spacing={2}>
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks found"
              description="Try a wider date range or wait for more activity."
            />
          ) : (
            tasks.map((task) => (
              <Stack
                key={task.id}
                spacing={1}
                sx={{
                  borderRadius: 4,
                  px: { xs: 2, sm: 2.5, lg: 2.75 },
                  py: { xs: 2, sm: 2.15 },
                  bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
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
                  <Chip size="small" label={`${task.timeEstimateMinutes} min`} />
                </Stack>
              </Stack>
            ))
          )}
        </Stack>
      </ListSection>

      <ListSection
        title={`Recent events (${events.length})`}
        subtitle="Outcome events attached to the picker workflow."
        panelSx={{
          borderRadius: { xs: 7, md: 999 },
        }}
        contentSx={{
          px: { xs: 0.65, sm: 1, lg: 1.35 },
          py: { xs: 0.4, sm: 0.6 },
        }}
      >
        <Stack spacing={2}>
          {events.length === 0 ? (
            <EmptyState
              title="No events found"
              description="Once picks are started, completed, or skipped, the timeline will fill in here."
            />
          ) : (
            events.map((event) => (
              <Stack
                key={event.id}
                spacing={1}
                sx={{
                  borderRadius: 4,
                  px: { xs: 2, sm: 2.5, lg: 2.75 },
                  py: { xs: 2, sm: 2.15 },
                  bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
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
      </ListSection>
    </Stack>
  );
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

const historyFilterFieldSx = getInvertedFieldSx();
