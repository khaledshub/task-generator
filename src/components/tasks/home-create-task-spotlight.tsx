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
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
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
  showProductivityTipsButton?: boolean;
}

export function HomeCreateTaskSpotlight({
  onStatusChange,
  showStatus = true,
  title = "Create Your Next Task",
  description = "Add a task directly from home. Your task is saved to your account and linked to your user ID so it is available every time you log back in.",
  buttonLabel = "Create task",
  showEnhancements = false,
  showProductivityTipsButton = true,
}: HomeCreateTaskSpotlightProps) {
  const [open, setOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<TaskFormState>({ statusState: "idle" });
  const aiRequestKeyRef = useRef<string | null>(null);
  const {
    statusState: localStatusState,
    message: localStatusMessage,
    createdTaskId: localStatusTaskId,
    aiStatus: localStatusAiStatus,
  } = localStatus;

  const handleStateChange = useCallback(
    (nextState: TaskFormState) => {
      setLocalStatus((current) => {
        const currentRequestKey = toAiRequestKey(current.aiGenerationRequest);
        const nextRequestKey = toAiRequestKey(nextState.aiGenerationRequest);
        if (
          current.statusState === nextState.statusState &&
          current.message === nextState.message &&
          current.aiStatus === nextState.aiStatus &&
          current.aiMessage === nextState.aiMessage &&
          current.createdTaskId === nextState.createdTaskId &&
          currentRequestKey === nextRequestKey
        ) {
          return current;
        }

        return nextState;
      });
      onStatusChange?.(nextState);

      if (nextState.statusState === "success") {
        setOpen(false);
      }
    },
    [onStatusChange],
  );

  useEffect(() => {
    const request = localStatus.aiGenerationRequest;
    if (
      localStatusState !== "success" ||
      !request ||
      !localStatusTaskId
    ) {
      return;
    }

    const requestKey = toAiRequestKey(request);
    if (!requestKey || aiRequestKeyRef.current === requestKey) {
      return;
    }
    aiRequestKeyRef.current = requestKey;

    void (async () => {
      const sourceLabel =
        request.aiProvider === "LOCAL" && request.localModel
          ? `${request.aiProvider} (${request.localModel})`
          : request.aiProvider;

      setLocalStatus((current) => {
        if (current.createdTaskId !== localStatusTaskId) {
          return current;
        }

        return {
          ...current,
          aiStatus: "info",
          aiMessage: `Generating AI tips with ${sourceLabel}...`,
        };
      });

      try {
        const response = await fetch("/api/ai/starter-step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        const data = (await response.json().catch(() => ({}))) as {
          result?: "ready" | "in_progress" | "error";
          aiStepsGenerationStatus?: "PENDING" | "READY" | "FAILED";
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          const nextErrorState: TaskFormState = {
            ...localStatus,
            aiStatus: "error",
            aiMessage:
              data.error ??
              `AI generation failed after task save (${request.aiProvider}).`,
          };
          setLocalStatus((current) =>
            current.createdTaskId === localStatusTaskId ? nextErrorState : current,
          );
          onStatusChange?.(nextErrorState);
          return;
        }

        if (data.result === "ready" || data.aiStepsGenerationStatus === "READY") {
          const nextReadyState: TaskFormState = {
            ...localStatus,
            aiStatus: "success",
            aiMessage: "AI tips are ready and available on the task details page.",
          };
          setLocalStatus((current) =>
            current.createdTaskId === localStatusTaskId ? nextReadyState : current,
          );
          onStatusChange?.(nextReadyState);
          return;
        }

        const nextInfoState: TaskFormState = {
          ...localStatus,
          aiStatus: "info",
          aiMessage:
            data.message ??
            `AI generation is still in progress (${request.aiProvider}).`,
        };
        setLocalStatus((current) =>
          current.createdTaskId === localStatusTaskId ? nextInfoState : current,
        );
        onStatusChange?.(nextInfoState);
      } catch (error) {
        const nextErrorState: TaskFormState = {
          ...localStatus,
          aiStatus: "error",
          aiMessage:
            error instanceof Error
              ? error.message
              : `AI generation failed after task save (${request.aiProvider}).`,
        };
        setLocalStatus((current) =>
          current.createdTaskId === localStatusTaskId ? nextErrorState : current,
        );
        onStatusChange?.(nextErrorState);
      }
    })();
  }, [aiRequestKeyRef, localStatus, localStatusState, localStatusTaskId, onStatusChange]);

  useEffect(() => {
    if (
      localStatusState !== "success" ||
      localStatusAiStatus !== "info" ||
      !localStatusTaskId
    ) {
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pollAiStatus = async () => {
      try {
        const response = await fetch(
          `/api/tasks/${localStatusTaskId}/ai-status`,
          { cache: "no-store" },
        );
        const data = (await response.json().catch(() => ({}))) as {
          aiStepsGenerationStatus?: "PENDING" | "READY" | "FAILED" | "SKIPPED";
          error?: string;
        };

        if (!response.ok && (response.status === 401 || response.status === 404)) {
          const nextErrorState: TaskFormState = {
            statusState: localStatusState,
            message: localStatusMessage,
            createdTaskId: localStatusTaskId,
            aiStatus: "error",
            aiMessage: data.error ?? "Could not confirm AI task generation status.",
          };

          setLocalStatus((current) => {
            if (current.createdTaskId !== localStatusTaskId) {
              return current;
            }

            return {
              ...current,
              aiStatus: "error",
              aiMessage: data.error ?? "Could not confirm AI task generation status.",
            };
          });
          onStatusChange?.(nextErrorState);
          return;
        }

        if (response.ok && data.aiStepsGenerationStatus && data.aiStepsGenerationStatus !== "PENDING") {
          if (stopped) {
            return;
          }

          const nextAiState = toSpotlightAiState(
            data.aiStepsGenerationStatus,
            localStatus,
          );

          const nextStatusState: TaskFormState = {
            statusState: localStatusState,
            message: localStatusMessage,
            createdTaskId: localStatusTaskId,
            aiStatus: nextAiState.aiStatus,
            aiMessage: nextAiState.aiMessage,
          };

          setLocalStatus((current) => {
            if (
              current.createdTaskId !== localStatusTaskId ||
              current.aiStatus !== "info"
            ) {
              return current;
            }

            return {
              ...current,
              aiStatus: nextAiState.aiStatus,
              aiMessage: nextAiState.aiMessage,
            };
          });
          onStatusChange?.(nextStatusState);
          return;
        }
      } catch {
        // Keep polling when transient network errors happen.
      }

      if (!stopped) {
        timer = setTimeout(pollAiStatus, 1800);
      }
    };

    timer = setTimeout(pollAiStatus, 1800);

    return () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    localStatus,
    localStatusAiStatus,
    localStatusMessage,
    localStatusTaskId,
    localStatusState,
    onStatusChange,
  ]);

  return (
    <>
      <Paper
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
          p: 4,
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          textAlign: "center",
          background:
            isDark
              ? "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,64,175,0.88), rgba(6,182,212,0.75))"
              : "linear-gradient(145deg, rgba(30,64,175,0.96), rgba(37,99,235,0.88), rgba(56,189,248,0.8))",
          color: "common.white",
          border: isDark
            ? "1px solid rgba(148,163,184,0.3)"
            : "1px solid rgba(255,255,255,0.24)",
          boxShadow: isDark
            ? "0 20px 42px rgba(2,6,23,0.46)"
            : "0 20px 42px rgba(30,64,175,0.3)",
          transition: "transform 220ms ease, box-shadow 220ms ease",
          "@keyframes createCardSparkPulse": {
            "0%": { opacity: 0.2, transform: "scale(0.92)" },
            "50%": { opacity: 0.52, transform: "scale(1.05)" },
            "100%": { opacity: 0.2, transform: "scale(0.92)" },
          },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "-22%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 26% 30%, rgba(191,219,254,0.3), rgba(56,189,248,0.2), transparent 68%)",
            pointerEvents: "none",
            animation: "createCardSparkPulse 3.6s ease-in-out infinite",
          },
            "&:hover": {
              transform: "translateY(-3px) scale(1.01)",
              boxShadow: isDark
                ? "0 28px 52px rgba(2,6,23,0.56)"
                : "0 28px 52px rgba(30,64,175,0.42)",
            },
          };
        }}
      >
        <Stack spacing={1.5} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
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
          <Typography sx={{ color: "rgba(255,255,255,0.84)" }} maxWidth={760}>
            {description}
          </Typography>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddTask />}
              sx={{
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.22)",
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.34)",
                backdropFilter: "blur(2px)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.28)",
                },
              }}
              onClick={() => {
                const idleState: TaskFormState = { statusState: "idle" };
                setLocalStatus(idleState);
                onStatusChange?.(idleState);
                setOpen(true);
              }}
            >
              {buttonLabel}
            </Button>
          </motion.div>
          {showEnhancements && showProductivityTipsButton ? (
            <Button variant="outlined" onClick={() => setIsInfoDrawerOpen(true)}>
              Productivity tips
            </Button>
          ) : null}

          {showStatus && localStatus.statusState !== "idle" ? (
            <Stack spacing={1} sx={{ width: "100%", maxWidth: 760 }}>
              <Alert
                severity={localStatus.statusState === "success" ? "success" : "error"}
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
                {localStatus.message ??
                  (localStatus.statusState === "success"
                    ? "Task created."
                    : "Could not save task.")}
              </Alert>
              {localStatus.aiStatus && localStatus.aiMessage ? (
                <Alert severity={localStatus.aiStatus} sx={{ textAlign: "left" }}>
                  {localStatus.aiMessage}
                </Alert>
              ) : null}
            </Stack>
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
          mode="create"
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

function toSpotlightAiState(
  status: "PENDING" | "READY" | "FAILED" | "SKIPPED",
  currentStatus: TaskFormState,
): Pick<TaskFormState, "aiStatus" | "aiMessage"> {
  if (status === "READY") {
    return {
      aiStatus: "success",
      aiMessage: "AI tips are ready and available on the task details page.",
    };
  }

  if (status === "FAILED") {
    return {
      aiStatus: "error",
      aiMessage:
        "Task created, but AI generation failed. You can still open the task and continue without AI tips.",
    };
  }

  if (status === "SKIPPED") {
    return {
      aiStatus: undefined,
      aiMessage: undefined,
    };
  }

  return {
    aiStatus: currentStatus.aiStatus,
    aiMessage: currentStatus.aiMessage,
  };
}

function toAiRequestKey(
  request: TaskFormState["aiGenerationRequest"],
): string | null {
  if (!request) {
    return null;
  }

  return `${request.taskId}:${request.aiProvider}:${request.localModel ?? ""}`;
}
