import {
  AutoAwesomeOutlined,
  BoltRounded,
  ChecklistRounded,
  PsychologyAltRounded,
  RadioButtonUncheckedRounded,
  ScheduleRounded,
} from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { AnimatedSection } from "@/components/ui/animated-section";
import { requireSessionUserId } from "@/lib/auth/session";
import { HomeCreateTaskSpotlight } from "@/components/tasks/home-create-task-spotlight";
import {
  ArchivedStatusChip,
  TaskRowActions,
} from "@/components/tasks/task-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TASK_CONTEXT_LABELS,
  TASK_ENERGY_LABELS,
  TASK_FREQUENCY_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/config";
import { getTasksPageData } from "@/lib/tasks/queries";
import { toStringArray } from "@/lib/tasks/types";

interface TasksPageProps {
  searchParams: Promise<{
    focusTask?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const userId = await requireSessionUserId();
  const { focusTask } = await searchParams;
  const focusedTaskId = focusTask?.trim() || null;
  const { activeTasks, archivedTasks } = await getTasksPageData(userId);
  const deepWorkCount = activeTasks.filter((task) => task.energy === "HIGH").length;
  const avoidingCount = activeTasks.filter((task) => task.avoiding).length;

  return (
    <Stack spacing={{ xs: 4.5, md: 6 }}>
      <AnimatedSection>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            spacing={{ xs: 2.5, lg: 4 }}
            alignItems={{ xs: "flex-start", lg: "flex-end" }}
          >
            <Stack spacing={1}>
              <Typography
                component="p"
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                Task Observatory
              </Typography>
              <Typography
                variant="h2"
                component="h1"
                sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" }, lineHeight: 0.94 }}
              >
                All Tasks
              </Typography>
              <Typography sx={{ maxWidth: 720, color: "text.secondary", fontSize: "1.05rem" }}>
                Manage the full task pool, tune the work that deserves focus, and keep the
                picker fed with clean next actions.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <SummaryPill
                label="Pending"
                value={String(activeTasks.length)}
                tone="primary"
              />
              <SummaryPill
                label="Deep work"
                value={String(deepWorkCount)}
                tone="secondary"
              />
              <SummaryPill
                label="Avoiding"
                value={String(avoidingCount)}
                tone="warning"
              />
              <SummaryPill
                label="Archived"
                value={String(archivedTasks.length)}
                tone="neutral"
              />
            </Stack>
          </Stack>
        </Stack>
      </AnimatedSection>

      <AnimatedSection delay={0.04}>
        <HomeCreateTaskSpotlight
          title="Task command center"
          description="Capture a task, define the work shape, and keep the list synchronized across sessions."
          buttonLabel="Create Task"
          showEnhancements
          showProductivityTipsButton
        />
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack spacing={0.75}>
              <Typography variant="h4" component="h2">
                Active Focus
              </Typography>
              <Typography color="text.secondary">
                The live pool currently available to the picker.
              </Typography>
            </Stack>

            <Box
              sx={{
                px: 1.8,
                py: 0.9,
                borderRadius: 999,
                bgcolor: "color-mix(in srgb, var(--mui-palette-secondary-main) 12%, transparent)",
                color: "var(--mui-palette-secondary-main)",
                fontWeight: 700,
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {activeTasks.length} Pending
            </Box>
          </Stack>

          {focusedTaskId ? (
            <Alert severity="success">
              New task is highlighted below. Open it to continue working.
            </Alert>
          ) : null}

          {activeTasks.length === 0 ? (
            <EmptyState
              title="No active tasks yet"
              description="Create your first task above to give the picker something real to work with."
            />
          ) : (
            <Stack spacing={2.5}>
              {activeTasks.map((task) => {
                const checklistCount = toStringArray(task.checklistItems).length;
                const tipsCount = toStringArray(task.tips).length;
                const isFocusedTask = focusedTaskId === task.id;

                return (
                  <Box
                    key={task.id}
                    id={`task-${task.id}`}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      scrollMarginTop: 96,
                      borderRadius: 8,
                      px: { xs: 2.25, md: 3 },
                      py: { xs: 2.25, md: 2.75 },
                      background:
                        "linear-gradient(180deg, rgba(23,31,51,0.72) 0%, rgba(19,27,46,0.88) 100%)",
                      border: isFocusedTask
                        ? "1px solid color-mix(in srgb, var(--mui-palette-primary-main) 28%, transparent)"
                        : "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(24px)",
                      transition:
                        "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 220ms cubic-bezier(0.2, 0.8, 0.2, 1), background 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                      boxShadow: isFocusedTask
                        ? "0 48px 48px -12px rgba(173,198,255,0.08)"
                        : "none",
                      "&::before": {
                        content: "\"\"",
                        position: "absolute",
                        inset: 0,
                        background: isFocusedTask
                          ? "radial-gradient(circle at top right, color-mix(in srgb, var(--mui-palette-primary-main) 18%, transparent), transparent 34%)"
                          : "radial-gradient(circle at top right, color-mix(in srgb, var(--mui-palette-secondary-main) 9%, transparent), transparent 34%)",
                        pointerEvents: "none",
                      },
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor:
                          "color-mix(in srgb, var(--mui-palette-secondary-main) 18%, transparent)",
                      },
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      justifyContent="space-between"
                      spacing={{ xs: 3, lg: 2.5 }}
                      sx={{ position: "relative", zIndex: 1 }}
                    >
                      <Stack spacing={2.25} sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              bgcolor:
                                "color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent)",
                              color: "var(--mui-palette-primary-main)",
                              flexShrink: 0,
                            }}
                          >
                            <RadioButtonUncheckedRounded />
                          </Box>

                          <Stack spacing={0.85} sx={{ minWidth: 0 }}>
                            <Typography
                              variant="h5"
                              component="h3"
                              sx={{ fontSize: { xs: "1.2rem", md: "1.45rem" } }}
                            >
                              {task.title}
                            </Typography>
                            {task.description ? (
                              <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                                {task.description}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <MetadataPill label={TASK_CONTEXT_LABELS[task.context]} />
                          <MetadataPill
                            label={TASK_ENERGY_LABELS[task.energy]}
                            icon={<BoltRounded sx={{ fontSize: 15 }} />}
                            tone={task.energy === "HIGH" ? "warning" : "secondary"}
                          />
                          <MetadataPill label={TASK_TYPE_LABELS[task.type]} />
                          <MetadataPill
                            label={TASK_FREQUENCY_LABELS[task.frequency]}
                            icon={<AutoAwesomeOutlined sx={{ fontSize: 15 }} />}
                            tone="primary"
                          />
                          <MetadataPill
                            label={`${task.timeEstimateMinutes} min`}
                            icon={<ScheduleRounded sx={{ fontSize: 15 }} />}
                          />
                          {task.avoiding ? (
                            <MetadataPill label="Avoiding" tone="warning" />
                          ) : null}
                          {isFocusedTask ? (
                            <MetadataPill label="Just created" tone="primary" />
                          ) : null}
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.5}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <Box
                            sx={{
                              px: 1.6,
                              py: 1.1,
                              borderRadius: 4,
                              bgcolor: "rgba(255,255,255,0.04)",
                              color: "text.secondary",
                              maxWidth: 720,
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                display: "block",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                color: "text.secondary",
                                mb: 0.45,
                              }}
                            >
                              Starter step
                            </Typography>
                            <Typography color="text.primary">{task.starterStep}</Typography>
                          </Box>

                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <InfoBadge
                              icon={<ChecklistRounded sx={{ fontSize: 16 }} />}
                              label={`${checklistCount} checklist`}
                            />
                            <InfoBadge
                              icon={<PsychologyAltRounded sx={{ fontSize: 16 }} />}
                              label={`${tipsCount} tips`}
                            />
                          </Stack>
                        </Stack>
                      </Stack>

                      <Stack
                        spacing={1.75}
                        alignItems={{ xs: "flex-start", lg: "flex-end" }}
                        justifyContent="space-between"
                      >
                        <FocusOrbit minutes={task.timeEstimateMinutes} />
                        <TaskRowActions taskId={task.id} />
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={1}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack spacing={0.75}>
              <Typography variant="h4" component="h2" color="text.secondary">
                Recently Archived
              </Typography>
              <Typography color="text.secondary">
                Tasks removed from the active pool but available to restore.
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: "0.84rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {archivedTasks.length} items
            </Typography>
          </Stack>

          {archivedTasks.length === 0 ? (
            <EmptyState
              title="No archived tasks yet"
              description="Archive tasks once they should no longer be considered for picking."
            />
          ) : (
            <Stack spacing={1.25}>
              {archivedTasks.map((task) => (
                <Box
                  key={task.id}
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 1.25,
                    px: 2,
                    py: 1.5,
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(194,198,214,0.92)",
                  }}
                >
                  <Stack spacing={0.35}>
                    <Typography sx={{ textDecoration: "line-through" }}>{task.title}</Typography>
                    <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                      Archived {getRelativeTimeLabel(task.updatedAt)}
                    </Typography>
                  </Stack>

                  <ArchivedStatusChip taskId={task.id} />
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </AnimatedSection>
    </Stack>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "secondary" | "warning" | "neutral";
}) {
  return (
    <Box
      sx={{
        minWidth: 124,
        px: 1.5,
        py: 1.2,
        borderRadius: 4,
        bgcolor: getSurfaceMix(tone, tone === "neutral" ? 8 : 12),
        border: `1px solid ${getSurfaceMix(tone, tone === "neutral" ? 8 : 14)}`,
      }}
    >
      <Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mb: 0.45 }}>
        {label}
      </Typography>
      <Typography variant="h5" component="p">
        {value}
      </Typography>
    </Box>
  );
}

function MetadataPill({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon?: ReactNode;
  tone?: "primary" | "secondary" | "warning" | "neutral";
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.2,
        py: 0.7,
        borderRadius: 999,
        bgcolor: tone === "neutral" ? "rgba(255,255,255,0.05)" : getSurfaceMix(tone, 16),
        color: getToneColor(tone),
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.01em",
      }}
    >
      {icon}
      <span>{label}</span>
    </Box>
  );
}

function InfoBadge({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.2,
        py: 0.8,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.04)",
        color: "text.secondary",
        fontSize: "0.8rem",
        fontWeight: 600,
      }}
    >
      {icon}
      <span>{label}</span>
    </Box>
  );
}

function FocusOrbit({ minutes }: { minutes: number }) {
  const dashOffset = 188 - Math.min(minutes, 120) / 120 * 188;

  return (
    <Box sx={{ position: "relative", width: 86, height: 86, flexShrink: 0 }}>
      <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
        <defs>
          <linearGradient id="focus-orbit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4cd7f6" />
            <stop offset="100%" stopColor="#b6c4ff" />
          </linearGradient>
        </defs>
        <circle cx="43" cy="43" r="31" fill="rgba(45,52,73,0.72)" />
        <circle
          cx="43"
          cy="43"
          r="31"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx="43"
          cy="43"
          r="31"
          fill="none"
          stroke="url(#focus-orbit-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="188"
          strokeDashoffset={dashOffset}
          transform="rotate(-90 43 43)"
        />
      </svg>
      <Stack
        spacing={0.15}
        alignItems="center"
        justifyContent="center"
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1 }}>
          {minutes}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.66rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          mins
        </Typography>
      </Stack>
    </Box>
  );
}

function getRelativeTimeLabel(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  return rtf.format(Math.round(diffMs / day), "day");
}

function getToneColor(tone: "primary" | "secondary" | "warning" | "neutral"): string {
  switch (tone) {
    case "primary":
      return "var(--mui-palette-primary-main)";
    case "secondary":
      return "var(--mui-palette-secondary-main)";
    case "warning":
      return "var(--mui-palette-warning-main)";
    case "neutral":
      return "var(--mui-palette-text-secondary)";
  }
}

function getSurfaceMix(
  tone: "primary" | "secondary" | "warning" | "neutral",
  percent: number,
): string {
  if (tone === "neutral") {
    return `rgba(255,255,255,${percent / 100})`;
  }

  return `color-mix(in srgb, ${getToneColor(tone)} ${percent}%, transparent)`;
}
