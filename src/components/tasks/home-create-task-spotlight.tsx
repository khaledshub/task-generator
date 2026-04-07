"use client";

import { AddTask } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { useTaskAiOrchestration } from "@/components/tasks/use-task-ai-orchestration";
import { AppDialog } from "@/components/ui/app-dialog";
import { AppDrawer } from "@/components/ui/app-drawer";
import { FeaturePanel } from "@/components/ui/surface-panel";
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
  showProductivityTipsButton?: boolean;
}

export function HomeCreateTaskSpotlight({
  onStatusChange,
  showStatus = true,
  title = "Create Your Next Task",
  description,
  buttonLabel = "Create task",
  showEnhancements = false,
  showProductivityTipsButton = true,
}: HomeCreateTaskSpotlightProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<TaskFormState>({ statusState: "idle" });
  const orchestration = useTaskAiOrchestration({
    baseState: localStatus,
    context: "create",
    enabled: true,
  });
  const effectiveStatus = orchestration.enhancedState;

  const handleStateChange = useCallback(
    (nextState: TaskFormState) => {
      setLocalStatus(nextState);
    },
    [],
  );

  useEffect(() => {
    onStatusChange?.(effectiveStatus);
  }, [effectiveStatus, onStatusChange]);

  useEffect(() => {
    if (!open || effectiveStatus.statusState !== "success") {
      return;
    }

    const hasAiRequest = Boolean(
      effectiveStatus.aiGenerationRequest && effectiveStatus.createdTaskId,
    );
    if (!hasAiRequest) {
      const timer = setTimeout(() => setOpen(false), 0);
      return () => {
        clearTimeout(timer);
      };
    }

    if (orchestration.lifecycle === "ai_success") {
      const timer = setTimeout(() => setOpen(false), 0);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [effectiveStatus, open, orchestration.lifecycle]);

  return (
    <>
      <FeaturePanel tone="spotlight" padding={{ xs: 2.25, sm: 2.75 }}>
        <Stack spacing={2.25} sx={{ position: "relative", zIndex: 1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1.5, md: 2.5 }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack spacing={0.75} sx={{ maxWidth: 720 }}>
              <Typography
                component="p"
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: alpha(theme.palette.common.white, 0.65),
                }}
              >
                Task Intake
              </Typography>
              <Typography variant="h4" component="h2">
                {title}
              </Typography>
              {description ? (
                <Typography sx={{ color: alpha(theme.palette.common.white, 0.82) }}>
                  {description}
                </Typography>
              ) : null}
            </Stack>

            {showEnhancements ? (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ color: alpha(theme.palette.common.white, 0.78) }}
              >
                {["Fast create", "Keyboard-ready", "Synced to picker"].map((label) => (
                  <Box
                    key={label}
                    component="span"
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 999,
                      bgcolor: alpha(theme.palette.common.white, 0.07),
                      border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Stack>

          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }}>
            <Box
              component="div"
              role="button"
              tabIndex={0}
              onClick={() => {
                const idleState: TaskFormState = { statusState: "idle" };
                setLocalStatus(idleState);
                onStatusChange?.(idleState);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  const idleState: TaskFormState = { statusState: "idle" };
                  setLocalStatus(idleState);
                  onStatusChange?.(idleState);
                  setOpen(true);
                }
              }}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1.6, sm: 1.9 },
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.54)} 0%, ${alpha(theme.palette.background.paper, 0.66)} 100%)`,
                color: "inherit",
                cursor: "pointer",
                textAlign: "left",
                backdropFilter: "blur(24px)",
                transition: `transform ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}, border-color ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}, background ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}`,
                "&:hover": {
                  borderColor: alpha(theme.palette.secondary.main, 0.28),
                  background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.62)} 0%, ${alpha(theme.palette.background.paper, 0.76)} 100%)`,
                },
                "&:focus-visible": {
                  outline: theme.app.focusRing,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.secondary.main, 0.14),
                  color: theme.palette.secondary.main,
                  flexShrink: 0,
                }}
              >
                <AddTask />
              </Box>

              <Stack spacing={0.3} sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    color: alpha(theme.palette.common.white, 0.52),
                    fontSize: { xs: "0.98rem", sm: "1.05rem" },
                  }}
                >
                  Add a new task...
                </Typography>
                <Typography
                  sx={{
                    color: alpha(theme.palette.common.white, 0.66),
                    fontSize: "0.82rem",
                  }}
                >
                  Open the full editor to define context, effort, starter step, and AI guidance.
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0 }}
              >
                <Box
                  component="span"
                  sx={{
                    px: 1.2,
                    py: 0.7,
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.common.white, 0.06),
                    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    color: alpha(theme.palette.common.white, 0.7),
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  CMD K
                </Box>
                <Button variant="contained" size="large">
                  {buttonLabel}
                </Button>
              </Stack>
            </Box>
          </motion.div>

          {showEnhancements && showProductivityTipsButton ? (
            <Button
              variant="text"
              onClick={() => setIsInfoDrawerOpen(true)}
              sx={{
                alignSelf: "flex-start",
                color: alpha(theme.palette.common.white, 0.82),
                px: 0,
              }}
            >
              Open task quality tips
            </Button>
          ) : null}

          {showStatus && effectiveStatus.statusState !== "idle" ? (
            <Stack spacing={1} sx={{ width: "100%" }}>
              <Alert
                severity={effectiveStatus.statusState === "success" ? "success" : "error"}
                sx={{ textAlign: "left" }}
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
                {effectiveStatus.message ??
                  (effectiveStatus.statusState === "success"
                    ? "Task created."
                    : "Could not save task.")}
              </Alert>
              {effectiveStatus.aiStatus && effectiveStatus.aiMessage ? (
                <Alert severity={effectiveStatus.aiStatus} sx={{ textAlign: "left" }}>
                  {effectiveStatus.aiMessage}
                </Alert>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </FeaturePanel>

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
          mode="create"
          externalAiState={{
            aiStatus: effectiveStatus.aiStatus,
            aiMessage: effectiveStatus.aiMessage,
          }}
          onRetryAi={orchestration.retry}
          disableSubmit={orchestration.isAiBusy}
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
