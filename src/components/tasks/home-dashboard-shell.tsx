"use client";

import {
  Add,
  Assignment,
  AutoAwesome,
  Bolt,
  CheckCircle,
  Close,
  EditNote,
  Explore,
  History,
  KeyboardArrowRight,
  Tune,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { createTaskAction } from "@/app/app/tasks/actions";
import { TaskForm } from "@/components/tasks/task-form";
import { AnimatedSection } from "@/components/ui/animated-section";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  INTENT_MODE_LABELS,
  INTENT_MODE_OPTIONS,
  INTENT_TIME_LABELS,
  INTENT_TIME_OPTIONS,
} from "@/lib/picker/config";
import { TASK_CONTEXT_LABELS, TASK_CONTEXTS } from "@/lib/tasks/config";
import {
  DEFAULT_TASK_FORM_VALUES,
  type TaskFormState,
} from "@/lib/tasks/types";

interface HomeDashboardShellProps {
  activeTasksCount: number;
  archivedTasksCount: number;
  eventsCount: number;
  completedTodayCount: number;
  focusStreakDays: number;
  recentActivity: Array<{
    id: string;
    title: string;
    action: "PICKED" | "STARTED" | "DONE" | "SKIPPED";
    pickedAtLabel: string;
    why: string;
  }>;
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
    <Alert
      severity={status.statusState === "success" ? "success" : "error"}
      action={
        <IconButton
          aria-label="Dismiss status banner"
          color="inherit"
          size="small"
          onClick={onDismiss}
        >
          <Close fontSize="inherit" />
        </IconButton>
      }
    >
      {status.message ??
        (status.statusState === "success"
          ? "Task created."
          : "Could not save task.")}
    </Alert>
  );
}

export function HomeDashboardShell({
  activeTasksCount,
  archivedTasksCount,
  completedTodayCount,
  focusStreakDays,
  recentActivity,
}: HomeDashboardShellProps) {
  const [status, setStatus] = useState<TaskFormState>({ statusState: "idle" });
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [draftTitle, setDraftTitle] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  useEffect(() => {
    if (status.statusState !== "success") {
      return;
    }

    const timer = setTimeout(() => {
      setIsCreateDialogOpen(false);
      setDraftTitle("");
    }, 150);

    return () => clearTimeout(timer);
  }, [status.statusState]);

  const createFormValues = useMemo(
    () => ({
      ...DEFAULT_TASK_FORM_VALUES,
      title: draftTitle.trim(),
    }),
    [draftTitle],
  );

  async function handlePickTask() {
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
    <Stack spacing={5}>
      <SaveStatusBanner
        status={status}
        onDismiss={() => setStatus({ statusState: "idle" })}
      />

      <AnimatedSection delay={0.03}>
        <Paper
          sx={(theme) => ({
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 5, md: 6 },
            px: { xs: 3, sm: 5, md: 7 },
            py: { xs: 4, sm: 6, md: 7 },
            background:
              theme.palette.mode === "dark"
                ? "rgba(23,31,51,0.7)"
                : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(241,247,255,0.88))",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 48px 48px -12px rgba(173,198,255,0.08)"
                : "0 40px 60px -24px rgba(77,142,255,0.16)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -90,
              right: -120,
              width: 380,
              height: 380,
              borderRadius: "50%",
              background:
                theme.palette.mode === "dark"
                  ? "radial-gradient(circle, rgba(76,215,246,0.16), transparent 68%)"
                  : "radial-gradient(circle, rgba(3,181,211,0.18), transparent 68%)",
              filter: "blur(20px)",
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              left: -140,
              bottom: -120,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background:
                theme.palette.mode === "dark"
                  ? "radial-gradient(circle, rgba(77,142,255,0.14), transparent 70%)"
                  : "radial-gradient(circle, rgba(77,142,255,0.16), transparent 70%)",
              filter: "blur(28px)",
              pointerEvents: "none",
            },
          })}
        >
          <Box
            sx={(theme) => ({
              position: "absolute",
              inset: 1,
              borderRadius: { xs: 5, md: 6 },
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(216,226,255,0.05) 0%, rgba(77,142,255,0.08) 34%, rgba(3,181,211,0.08) 68%, rgba(255,255,255,0.02) 100%)"
                  : "linear-gradient(135deg, rgba(77,142,255,0.08) 0%, rgba(173,198,255,0.16) 34%, rgba(3,181,211,0.1) 68%, rgba(255,255,255,0.28) 100%)",
              pointerEvents: "none",
            })}
          />
          <Stack spacing={4.5} sx={{ position: "relative", zIndex: 1 }}>
            <Stack spacing={2.5} maxWidth={760} sx={{ ml: { md: 1.5 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Explore sx={{ color: "#4cd7f6", fontSize: 30 }} />
                <Typography
                  variant="overline"
                  sx={{
                    letterSpacing: "0.24em",
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(173,198,255,0.8)"
                        : alpha(theme.palette.primary.dark, 0.72),
                    fontWeight: 700,
                  }}
                >
                  Task Command Center
                </Typography>
              </Stack>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontSize: { xs: "2.6rem", md: "4.35rem" },
                  lineHeight: 0.98,
                  fontWeight: 800,
                  maxWidth: 780,
                }}
              >
                Create your{" "}
                <Box
                  component="span"
                  sx={{
                    color: "secondary.main",
                  }}
                >
                  next task
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "1rem", md: "1.08rem" },
                  color: "text.secondary",
                  maxWidth: 560,
                }}
              >
                Define your objective and let the picker guide your workflow with
                better context, clearer momentum, and less second-guessing.
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="What needs your focus?"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <EditNote sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={(theme) => ({
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 4,
                    background:
                      theme.palette.mode === "dark"
                        ? "#060e20"
                        : "rgba(238,243,255,0.92)",
                    color: theme.palette.text.primary,
                    "& fieldset": {
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "rgba(140,144,159,0.15)"
                          : "rgba(77,142,255,0.14)",
                    },
                    "&:hover fieldset": {
                      borderColor: alpha(theme.palette.secondary.main, 0.28),
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                    },
                  },
                })}
              />
              <Button
                variant="contained"
                onClick={() => setIsCreateDialogOpen(true)}
                endIcon={<Add />}
                sx={{
                  minWidth: { md: 220 },
                  px: 4.5,
                  py: 1.8,
                  borderRadius: 4,
                  fontWeight: 800,
                  color: (theme) => theme.palette.primary.contrastText,
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(173,198,255,1) 0%, rgba(77,142,255,1) 100%)"
                      : "linear-gradient(135deg, rgba(77,142,255,1) 0%, rgba(0,90,194,1) 100%)",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 0 24px rgba(77,142,255,0.34)"
                      : "0 18px 36px rgba(77,142,255,0.22)",
                  "&:hover": {
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 0 32px rgba(77,142,255,0.45)"
                        : "0 20px 42px rgba(77,142,255,0.3)",
                  },
                }}
              >
                Add task
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </AnimatedSection>

      {isBannerVisible && focusStreakDays > 0 ? (
        <AnimatedSection delay={0.06}>
          <Alert
            icon={<AutoAwesome sx={{ color: "#4cd7f6" }} />}
            severity="info"
            action={
              <IconButton
                aria-label="Dismiss focus streak banner"
                color="inherit"
                size="small"
                onClick={() => setIsBannerVisible(false)}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(3,181,211,0.08)"
                  : "rgba(76,215,246,0.12)",
              border: "none",
              borderRadius: 3,
            }}
          >
            You&apos;re on a {focusStreakDays}-day focus streak. Keep it up.
          </Alert>
        </AnimatedSection>
      ) : null}

      <AnimatedSection delay={0.09}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={4}
          alignItems={{ xs: "stretch", lg: "flex-end" }}
        >
          <Box flex={1}>
            <Typography
              variant="h5"
              sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3 }}
            >
              <Tune sx={{ color: "secondary.main" }} />
              Refine your focus
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="home-context-label">Context</InputLabel>
                <Select
                  labelId="home-context-label"
                  label="Context"
                  value={pickContextFilter}
                  onChange={(event) =>
                    setPickContextFilter(
                      event.target.value as (typeof TASK_CONTEXTS)[number] | "",
                    )
                  }
                  sx={pickerSelectSx}
                >
                  {TASK_CONTEXTS.map((context) => (
                    <MenuItem key={context} value={context}>
                      {TASK_CONTEXT_LABELS[context]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="home-mode-label">Mode</InputLabel>
                <Select
                  labelId="home-mode-label"
                  label="Mode"
                  value={pickModeChoice}
                  onChange={(event) =>
                    setPickModeChoice(
                      event.target.value as (typeof INTENT_MODE_OPTIONS)[number] | "",
                    )
                  }
                  sx={pickerSelectSx}
                >
                  {INTENT_MODE_OPTIONS.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {INTENT_MODE_LABELS[mode]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="home-time-label">Time</InputLabel>
                <Select
                  labelId="home-time-label"
                  label="Time"
                  value={pickTimeChoice}
                  onChange={(event) =>
                    setPickTimeChoice(
                      event.target.value
                        ? (Number(event.target.value) as (typeof INTENT_TIME_OPTIONS)[number])
                        : "",
                    )
                  }
                  sx={pickerSelectSx}
                >
                  {INTENT_TIME_OPTIONS.map((minutes) => (
                    <MenuItem key={minutes} value={minutes}>
                      {INTENT_TIME_LABELS[minutes]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Button
            onClick={handlePickTask}
            sx={{
              minWidth: { xs: "100%", lg: 260 },
              height: { xs: 72, lg: 96 },
              alignSelf: "stretch",
              borderRadius: 4,
              color: "primary.contrastText",
              fontSize: { xs: "1rem", lg: "1.18rem" },
              fontWeight: 800,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(96,165,250,1) 0%, rgba(76,215,246,1) 100%)"
                  : "linear-gradient(135deg, rgba(3,181,211,1) 0%, rgba(77,142,255,1) 100%)",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 16px 40px rgba(76,215,246,0.28)"
                  : "0 18px 42px rgba(77,142,255,0.22)",
              "&:hover": {
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 18px 48px rgba(76,215,246,0.38)"
                    : "0 22px 52px rgba(77,142,255,0.28)",
              },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <span>Pick my next task</span>
              <Bolt fontSize="large" />
            </Stack>
          </Button>
        </Stack>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 3,
          }}
        >
          <StatCard
            label="Active Tasks"
            value={activeTasksCount}
            accent="#60a5fa"
            icon={<Assignment />}
            meta="Update: Now"
            visual={<ProgressBar value={Math.min(92, 16 + activeTasksCount * 8)} color="#60a5fa" />}
          />
          <StatCard
            label="Completed Today"
            value={completedTodayCount}
            accent="#4cd7f6"
            icon={<CheckCircle />}
            meta={`Goal: ${Math.max(8, completedTodayCount + 3)}`}
            visual={<ProgressBar value={Math.min(100, completedTodayCount * 18)} color="#4cd7f6" />}
          />
          <StatCard
            label="Archived"
            value={archivedTasksCount}
            accent="#b6c4ff"
            icon={<History />}
            meta="Total"
            visual={
              <Stack direction="row" spacing={-0.75}>
                {[0, 1, 2].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: (theme) => `2px solid ${theme.palette.background.default}`,
                      bgcolor: `rgba(182,196,255,${0.32 + index * 0.16})`,
                    }}
                  />
                ))}
              </Stack>
            }
          />
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <Paper
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(23,31,51,0.7)"
                : "rgba(255,255,255,0.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 48px 48px -12px rgba(173,198,255,0.08)"
                : "0 40px 56px -22px rgba(77,142,255,0.14)",
          })}
        >
          <Stack spacing={3.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h5">Focus stream</Typography>
              <Button
                href="/app/history"
                sx={{ color: "secondary.main" }}
                endIcon={<KeyboardArrowRight />}
              >
                View all
              </Button>
            </Stack>

            {recentActivity.length === 0 ? (
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  No recent activity yet
                </Typography>
                <Typography color="text.secondary">
                  Your most recent picks and outcomes will appear here after you
                  start using the picker.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                {recentActivity.map((item) => (
                  <Paper
                    key={item.id}
                    sx={(theme) => ({
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(34,42,61,0.82)"
                          : "rgba(239,245,255,0.9)",
                      boxShadow: "none",
                    })}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={(theme) => ({
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(45,52,73,0.9)"
                              : "rgba(228,236,250,0.95)",
                          display: "grid",
                          placeItems: "center",
                          color: activityAccent(item.action),
                        })}
                      >
                        {activityIcon(item.action)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700}>{item.title}</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: "0.92rem" }}>
                          {activityLabel(item.action)} • {item.why}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          {item.pickedAtLabel}
                        </Typography>
                        <Typography sx={{ color: activityAccent(item.action), fontWeight: 700 }}>
                          {activityReward(item.action)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </AnimatedSection>

      <AppDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Create task"
        description="Complete the task details below and save to your workspace."
      >
        <TaskForm
          action={createTaskAction}
          initialValues={createFormValues}
          submitLabel="Create task"
          onStateChange={setStatus}
          mode="create"
        />
      </AppDialog>

      <AppDialog
        open={isPickDialogOpen}
        onClose={() => setIsPickDialogOpen(false)}
        title="Pick my next task"
        description="Review the picker result for your current focus filters."
      >
        <Stack spacing={2}>
          {isPickingTask ? (
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={20} />
              <Typography>Picking a task for your current focus mode...</Typography>
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
            <Paper
              sx={(theme) => ({
                p: 3,
                borderRadius: 4,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(23,31,51,0.72)"
                    : "rgba(248,251,255,0.92)",
                backdropFilter: "blur(24px)",
                boxShadow: "none",
              })}
            >
              <Stack spacing={1.5}>
                <Typography variant="h5">{homePickResult.task.title}</Typography>
                {homePickResult.task.description ? (
                  <Typography color="text.secondary">
                    {homePickResult.task.description}
                  </Typography>
                ) : null}
                <Alert severity="success">
                  Why this was picked: {homePickResult.why}
                </Alert>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Starter step
                  </Typography>
                  <Typography>{homePickResult.task.starterStep}</Typography>
                </Box>
                {homePickResult.task.tips.length > 0 ? (
                  <Box>
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
                  </Box>
                ) : null}
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </AppDialog>
    </Stack>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
  meta,
  visual,
}: {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
  meta: string;
  visual: React.ReactNode;
}) {
  return (
    <Paper
      sx={(theme) => ({
        p: 3,
        borderRadius: 4,
        background:
          theme.palette.mode === "dark"
            ? "rgba(23,31,51,0.72)"
            : "rgba(255,255,255,0.84)",
        backdropFilter: "blur(20px)",
        transition: "background-color 180ms ease, transform 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.04)"
              : "rgba(248,251,255,0.96)",
        },
      })}
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: `${accent}1A`,
              color: accent,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(45,52,73,0.95)"
                  : "rgba(233,240,251,0.96)",
              color: "text.secondary",
            }}
          >
            {meta}
          </Typography>
        </Stack>

        <Box>
          <Typography
            sx={{
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: "3rem",
              lineHeight: 1,
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', 'Space Grotesk', sans-serif",
            }}
          >
            {String(value).padStart(2, "0")}
          </Typography>
        </Box>

        {visual}
      </Stack>
    </Paper>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: 6,
        borderRadius: 999,
        overflow: "hidden",
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(45,52,73,0.95)"
            : "rgba(223,232,247,0.96)",
      }}
    >
      <Box
        sx={{
          width: `${value}%`,
          height: "100%",
          borderRadius: 999,
          bgcolor: color,
        }}
      />
    </Box>
  );
}

function activityLabel(action: HomeDashboardShellProps["recentActivity"][number]["action"]) {
  if (action === "DONE") {
    return "Completed";
  }

  if (action === "STARTED") {
    return "Started";
  }

  if (action === "SKIPPED") {
    return "Skipped";
  }

  return "Picked";
}

function activityReward(action: HomeDashboardShellProps["recentActivity"][number]["action"]) {
  if (action === "DONE") {
    return "+24 XP";
  }

  if (action === "STARTED") {
    return "+12 XP";
  }

  if (action === "SKIPPED") {
    return "Reroute";
  }

  return "+6 XP";
}

function activityAccent(action: HomeDashboardShellProps["recentActivity"][number]["action"]) {
  if (action === "DONE") {
    return "#4cd7f6";
  }

  if (action === "STARTED") {
    return "#60a5fa";
  }

  if (action === "SKIPPED") {
    return "#fbbf24";
  }

  return "#adc6ff";
}

function activityIcon(action: HomeDashboardShellProps["recentActivity"][number]["action"]) {
  if (action === "DONE") {
    return <CheckCircle fontSize="small" />;
  }

  if (action === "STARTED") {
    return <Bolt fontSize="small" />;
  }

  if (action === "SKIPPED") {
    return <History fontSize="small" />;
  }

  return <Explore fontSize="small" />;
}

const pickerSelectSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === "dark"
        ? "#222a3d"
        : "rgba(236,243,255,0.92)",
  },
};
