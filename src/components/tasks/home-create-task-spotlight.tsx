"use client";

import { AddTask } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { AppDialog } from "@/components/ui/app-dialog";
import { AppDrawer } from "@/components/ui/app-drawer";
import { createTaskAction } from "@/app/app/tasks/actions";
import {
  DEFAULT_TASK_FORM_VALUES,
  type TaskFormState,
} from "@/lib/tasks/types";

interface HomeCreateTaskSpotlightProps {
  onStatusChange?: (status: TaskFormState) => void;
  showStatus?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
  showEnhancements?: boolean;
}

export function HomeCreateTaskSpotlight({
  onStatusChange,
  showStatus = true,
  title = "Create Your Next Task",
  description = "Add a task directly from home. Your task is saved to your account and linked to your user ID so it is available every time you log back in.",
  buttonLabel = "Create task",
  showEnhancements = false,
}: HomeCreateTaskSpotlightProps) {
  const [open, setOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<TaskFormState>({ statusState: "idle" });

  useEffect(() => {
    if (!showStatus || localStatus.statusState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setLocalStatus({ statusState: "idle" });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [localStatus, showStatus]);

  function handleStateChange(nextState: TaskFormState) {
    setLocalStatus(nextState);
    onStatusChange?.(nextState);

    if (nextState.statusState === "success") {
      setOpen(false);
    }
  }

  return (
    <>
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          background:
            "linear-gradient(140deg, rgba(15,118,110,0.12), rgba(20,184,166,0.18), rgba(251,191,36,0.12))",
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          {showEnhancements ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" color="primary" label="Fast create" />
              <Chip size="small" color="success" label="Keyboard-friendly" />
              <Chip size="small" color="warning" label="In-place workflow" />
            </Stack>
          ) : null}

          <Typography variant="h4" component="h2">
            {title}
          </Typography>
          <Typography color="text.secondary" maxWidth={760}>
            {description}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddTask />}
            onClick={() => {
              const idleState: TaskFormState = { statusState: "idle" };
              setLocalStatus(idleState);
              onStatusChange?.(idleState);
              setOpen(true);
            }}
          >
            {buttonLabel}
          </Button>
          {showEnhancements ? (
            <Button variant="outlined" onClick={() => setIsInfoDrawerOpen(true)}>
              Productivity tips
            </Button>
          ) : null}

          {showStatus && localStatus.statusState !== "idle" ? (
            <Alert
              severity={localStatus.statusState === "success" ? "success" : "error"}
              sx={{ width: "100%", maxWidth: 760, textAlign: "left" }}
              action={
                <IconButton
                  aria-label="Close status banner"
                  color="inherit"
                  size="small"
                  onClick={() => setLocalStatus({ statusState: "idle" })}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {localStatus.message ??
                (localStatus.statusState === "success"
                  ? "Task created."
                  : "Could not save task.")}
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create task"
        description="Complete the task details below and save to your workspace."
      >
        <TaskForm
          action={createTaskAction}
          initialValues={DEFAULT_TASK_FORM_VALUES}
          submitLabel="Create task"
          onStateChange={handleStateChange}
        />
      </AppDialog>

      <AppDrawer
        open={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
        title="Productivity tips"
        description="Use this checklist to keep task quality high and picker results consistent."
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            Keep starter steps tiny. If you cannot begin it in two minutes, split it.
          </Typography>
          <Typography color="text.secondary">
            Use checklist items only for ordered steps. Use tips for recurring friction.
          </Typography>
          <Button variant="contained" onClick={() => setIsInfoDrawerOpen(false)}>
            Close drawer
          </Button>
        </Stack>
      </AppDrawer>
    </>
  );
}
