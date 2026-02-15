import {
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PickAction } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";

interface HistoryPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const userId = await requireSessionUserId();
  const { from, to } = await searchParams;

  const fromDate = parseDate(from);
  const toDate = parseDate(to);

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
    take: 200,
  });

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            History
          </Typography>
          <Typography color="text.secondary">
            Full event log of picks and status updates.
          </Typography>
        </Stack>
      </Paper>

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
          <Typography variant="h6">Events ({events.length})</Typography>

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
