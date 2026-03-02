"use client";

import { Bolt, CalendarMonth, Checklist, Insights } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { HomeCreateTaskSpotlight } from "@/components/tasks/home-create-task-spotlight";
import type { TaskFormState } from "@/lib/tasks/types";

interface HomeDashboardShellProps {
  activeTasksCount: number;
  archivedTasksCount: number;
  eventsCount: number;
}

function SaveStatusBanner({
  status,
  onDismiss,
}: {
  status: TaskFormState;
  onDismiss: () => void;
}) {
  if (status.statusState === "idle") {
    return null;
  }

  return (
    <Alert
      severity={status.statusState === "success" ? "success" : "error"}
      action={
        <IconButton
          aria-label="Close status banner"
          color="inherit"
          size="small"
          onClick={onDismiss}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
    >
      {status.message ??
        (status.statusState === "success" ? "Task created." : "Could not save task.")}
    </Alert>
  );
}

export function HomeDashboardShell({
  activeTasksCount,
  archivedTasksCount,
  eventsCount,
}: HomeDashboardShellProps) {
  const [status, setStatus] = useState<TaskFormState>({ statusState: "idle" });
  const dismissStatus = () => setStatus({ statusState: "idle" });

  useEffect(() => {
    if (status.statusState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatus({ statusState: "idle" });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: 3,
          background:
            "linear-gradient(120deg, rgba(15,118,110,0.10), rgba(251,191,36,0.13))",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Focus cockpit
          </Typography>
          <Typography color="text.secondary">
            Pick the highest-leverage task for your current energy and context.
            All core systems are connected and live.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href="/app/tasks" variant="outlined">
              Open tasks
            </Button>
            <Button href="/app/pick" variant="outlined">
              Pick my task
            </Button>
            <Button href="/app/history" variant="text">
              View history
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <SaveStatusBanner status={status} onDismiss={dismissStatus} />

      <HomeCreateTaskSpotlight onStatusChange={setStatus} showStatus={false} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Checklist fontSize="small" />
            <Typography variant="h6">Active tasks</Typography>
          </Stack>
          <Typography color="text.secondary">{activeTasksCount} ready to pick.</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Bolt fontSize="small" />
            <Typography variant="h6">Completed actions</Typography>
          </Stack>
          <Typography color="text.secondary">{eventsCount} status events logged.</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonth fontSize="small" />
            <Typography variant="h6">Archived</Typography>
          </Stack>
          <Typography color="text.secondary">{archivedTasksCount} archived tasks.</Typography>
        </Paper>
      </Stack>

      <Alert severity="info">
        <Stack direction="row" spacing={1} alignItems="center">
          <Insights fontSize="small" />
          <span>2026-ready flow: create, pick, track, and iterate from one workspace.</span>
        </Stack>
      </Alert>
    </Stack>
  );
}
