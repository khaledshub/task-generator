"use client";

import {
  AutoAwesome,
  Bolt,
  CalendarMonth,
  Checklist,
  Insights,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { HomeCreateTaskSpotlight } from "@/components/tasks/home-create-task-spotlight";
import { AnimatedSection } from "@/components/ui/animated-section";
import {
  INTENT_MODE_LABELS,
  INTENT_MODE_OPTIONS,
  INTENT_TIME_LABELS,
  INTENT_TIME_OPTIONS,
} from "@/lib/picker/config";
import { TASK_CONTEXT_LABELS, TASK_CONTEXTS } from "@/lib/tasks/config";
import type { TaskFormState } from "@/lib/tasks/types";

interface HomeDashboardShellProps {
  activeTasksCount: number;
  archivedTasksCount: number;
  eventsCount: number;
}

interface HomePickResponse {
  status: "picked" | "no_match";
  reason?: string;
  why?: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    starterStep: string;
    tips: string[];
  };
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
    <Stack spacing={1}>
      <Alert
        severity={status.statusState === "success" ? "success" : "error"}
        action={
          <Stack direction="row" spacing={0.75} alignItems="center">
            {status.statusState === "success" && status.createdTaskId ? (
              <Button
                variant="contained"
                size="small"
                href={`/app/tasks/${status.createdTaskId}`}
                sx={{
                  fontWeight: 700,
                  bgcolor: "common.white",
                  color: "success.dark",
                  "&:hover": { bgcolor: "grey.100" },
                }}
              >
                Go to task
              </Button>
            ) : null}
            <IconButton
              aria-label="Close status banner"
              color="inherit"
              size="small"
              onClick={onDismiss}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Stack>
        }
      >
        <Typography component="span">
          {status.message ??
            (status.statusState === "success"
              ? "Task created."
              : "Could not save task.")}
        </Typography>
      </Alert>
      {status.aiStatus && status.aiMessage ? (
        <Alert severity={status.aiStatus}>{status.aiMessage}</Alert>
      ) : null}
    </Stack>
  );
}

export function HomeDashboardShell({
  activeTasksCount,
  archivedTasksCount,
  eventsCount,
}: HomeDashboardShellProps) {
  const [status, setStatus] = useState<TaskFormState>({ statusState: "idle" });
  const [pickContextFilter, setPickContextFilter] = useState<(typeof TASK_CONTEXTS)[number] | "">(
    "",
  );
  const [pickModeChoice, setPickModeChoice] = useState<(typeof INTENT_MODE_OPTIONS)[number] | "">(
    "",
  );
  const [pickTimeChoice, setPickTimeChoice] = useState<(typeof INTENT_TIME_OPTIONS)[number] | "">(
    "",
  );
  const [isPickDialogOpen, setIsPickDialogOpen] = useState(false);
  const [isPickingTask, setIsPickingTask] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [homePickResult, setHomePickResult] = useState<HomePickResponse | null>(null);
  const dismissStatus = () => setStatus({ statusState: "idle" });

  async function handlePickFromHome() {
    setIsPickDialogOpen(true);
    setIsPickingTask(true);
    setPickError(null);
    setHomePickResult(null);

    const response = await fetch("/api/intents/pick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(pickContextFilter ? { contextChoice: pickContextFilter } : {}),
        ...(pickModeChoice ? { modeChoice: pickModeChoice } : {}),
        ...(pickTimeChoice !== "" ? { timeAvailableMinutes: pickTimeChoice } : {}),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as HomePickResponse & {
      error?: string;
    };

    if (!response.ok) {
      setPickError(data.error ?? "Could not pick a task.");
      setIsPickingTask(false);
      return;
    }

    setHomePickResult(data);
    setIsPickingTask(false);
  }

  return (
    <Stack spacing={3}>
      <SaveStatusBanner status={status} onDismiss={dismissStatus} />

      <AnimatedSection delay={0.05}>
        <HomeCreateTaskSpotlight onStatusChange={setStatus} showStatus={false} />
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <Paper
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
            p: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            border: isDark
              ? "1px solid rgba(148,163,184,0.26)"
              : "1px solid rgba(255,255,255,0.26)",
            background:
              isDark
                ? "linear-gradient(120deg, rgba(15,23,42,0.98), rgba(30,64,175,0.9), rgba(8,145,178,0.85))"
                : "linear-gradient(120deg, rgba(30,64,175,0.96), rgba(37,99,235,0.92), rgba(14,165,233,0.88))",
            color: "common.white",
            boxShadow: isDark
              ? "0 22px 40px rgba(2,6,23,0.55)"
              : "0 22px 40px rgba(29,78,216,0.34)",
            transition: "transform 220ms ease, box-shadow 220ms ease",
            "@keyframes pickCardGlowPulse": {
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
              animation: "pickCardGlowPulse 4.5s ease-in-out infinite",
            },
              "&:hover": {
                transform: "translateY(-3px) scale(1.01)",
                boxShadow: isDark
                  ? "0 28px 52px rgba(2,6,23,0.62)"
                  : "0 28px 52px rgba(29,78,216,0.42)",
              },
            };
          }}
        >
          <Stack
            direction="column"
            spacing={1.5}
            alignItems="stretch"
            justifyContent="flex-start"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesome fontSize="small" />
                <Typography variant="h6" fontWeight={700}>
                  Pick my task
                </Typography>
              </Stack>
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                Choose a task based on your current context, energy, and time.
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 0.5 }}>
                Feeling today
              </Typography>

              <Stack direction="row" spacing={1.25} sx={{ pt: 1.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel
                    id="home-pick-context-label"
                    shrink={pickContextFilter !== ""}
                    sx={{ color: "rgba(255,255,255,0.82)" }}
                  >
                    Context
                  </InputLabel>
                  <Select
                    labelId="home-pick-context-label"
                    label="Context"
                    value={pickContextFilter}
                    onChange={(event) =>
                      setPickContextFilter(event.target.value as (typeof TASK_CONTEXTS)[number] | "")
                    }
                    sx={{
                      color: "common.white",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.35)",
                      },
                      "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.9)" },
                    }}
                  >
                    {TASK_CONTEXTS.map((context) => (
                      <MenuItem key={context} value={context}>
                        {TASK_CONTEXT_LABELS[context]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel
                    id="home-pick-mode-label"
                    shrink={pickModeChoice !== ""}
                    sx={{ color: "rgba(255,255,255,0.82)" }}
                  >
                    Mode
                  </InputLabel>
                  <Select
                    labelId="home-pick-mode-label"
                    label="Mode"
                    value={pickModeChoice}
                    onChange={(event) =>
                      setPickModeChoice(event.target.value as (typeof INTENT_MODE_OPTIONS)[number] | "")
                    }
                    sx={{
                      color: "common.white",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.35)",
                      },
                      "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.9)" },
                    }}
                  >
                    {INTENT_MODE_OPTIONS.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {INTENT_MODE_LABELS[mode]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel
                    id="home-pick-time-label"
                    shrink={pickTimeChoice !== ""}
                    sx={{ color: "rgba(255,255,255,0.82)" }}
                  >
                    Time
                  </InputLabel>
                  <Select
                    labelId="home-pick-time-label"
                    label="Time"
                    value={pickTimeChoice}
                    onChange={(event) =>
                      setPickTimeChoice(
                        event.target.value
                          ? (Number(event.target.value) as (typeof INTENT_TIME_OPTIONS)[number])
                          : "",
                      )
                    }
                    sx={{
                      color: "common.white",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.35)",
                      },
                      "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.9)" },
                    }}
                  >
                    {INTENT_TIME_OPTIONS.map((time) => (
                      <MenuItem key={time} value={time}>
                        {INTENT_TIME_LABELS[time]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              style={{ alignSelf: "center", marginTop: 8 }}
            >
              <Button
                variant="contained"
                onClick={handlePickFromHome}
                sx={{
                  fontWeight: 700,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "common.white",
                  backdropFilter: "blur(3px)",
                  border: "1px solid rgba(255,255,255,0.34)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.28)",
                  },
                }}
              >
                Pick task
              </Button>
            </motion.div>
          </Stack>
        </Paper>
      </AnimatedSection>

      <AnimatedSection delay={0.14}>
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
      </AnimatedSection>

      <AnimatedSection delay={0.18}>
        <Alert severity="info">
          <Stack direction="row" spacing={1} alignItems="center">
            <Insights fontSize="small" />
            <span>2026-ready flow: create, pick, track, and iterate from one workspace.</span>
          </Stack>
        </Alert>
      </AnimatedSection>

      <Dialog
        open={isPickDialogOpen}
        onClose={() => setIsPickDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Pick my task</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {isPickingTask ? (
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={20} />
                <Typography>Picking a task for your current feeling...</Typography>
              </Stack>
            ) : null}

            {pickError ? <Alert severity="error">{pickError}</Alert> : null}

            {homePickResult?.status === "no_match" ? (
              <Alert severity="info">
                {homePickResult.reason ??
                  "No matching task for this filter. Try broader options or add tasks."}
              </Alert>
            ) : null}

            {homePickResult?.status === "picked" && homePickResult.task ? (
              <motion.div
                key={homePickResult.task.id}
                initial={{ opacity: 0, scale: 0.9, y: 18 }}
                animate={{
                  opacity: 1,
                  scale: [1, 1.08, 0.97, 1.03, 1],
                  rotate: [0, -2, 2, -1, 0],
                  y: 0,
                }}
                transition={{ duration: 0.85, ease: "easeOut" }}
              >
                <Paper sx={{ p: 2.25 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h5" fontWeight={700}>
                      {homePickResult.task.title}
                    </Typography>
                    {homePickResult.task.description ? (
                      <Typography color="text.secondary">
                        {homePickResult.task.description}
                      </Typography>
                    ) : null}
                    <Alert severity="success">
                      Why this was picked: {homePickResult.why}
                    </Alert>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Starter step
                      </Typography>
                      <Typography>{homePickResult.task.starterStep}</Typography>
                    </Stack>
                    {homePickResult.task.tips.length > 0 ? (
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Get started
                        </Typography>
                        <Stack component="ul" sx={{ m: 0, pl: 3 }}>
                          {homePickResult.task.tips.map((tip) => (
                            <Typography component="li" key={tip}>
                              {tip}
                            </Typography>
                          ))}
                        </Stack>
                      </Stack>
                    ) : null}
                  </Stack>
                </Paper>
              </motion.div>
            ) : null}

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setIsPickDialogOpen(false)}>Close</Button>
              <Button
                href={
                  homePickResult?.status === "picked" && homePickResult.task
                    ? `/app/tasks/${homePickResult.task.id}`
                    : "/app/pick"
                }
                variant="outlined"
              >
                Open full picker
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
