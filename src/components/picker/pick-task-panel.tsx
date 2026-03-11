"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  INTENT_CONTEXT_OPTIONS,
  INTENT_MODE_LABELS,
  INTENT_MODE_OPTIONS,
  INTENT_TIME_LABELS,
  INTENT_TIME_OPTIONS,
  SKIPPED_REASON_LABELS,
  SKIPPED_REASON_OPTIONS,
  type PickActionValue,
  type SkippedReasonValue,
} from "@/lib/picker/config";
import { TASK_CONTEXT_LABELS } from "@/lib/tasks/config";

interface PickResponse {
  status: "picked" | "no_match";
  intentId: string;
  reason?: string;
  why?: string;
  pickEventId?: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    starterStep: string;
    aiGeneratedSteps: string[];
    checklistItems: string[];
    tips: string[];
  };
}

interface ActionResponse {
  id: string;
}

interface PickTaskPanelProps {
  initialIntent?: {
    contextChoice: (typeof INTENT_CONTEXT_OPTIONS)[number];
    modeChoice: (typeof INTENT_MODE_OPTIONS)[number];
    timeChoice: (typeof INTENT_TIME_OPTIONS)[number];
  };
}

function toIntentContextFromQuery(
  value: string | null,
): (typeof INTENT_CONTEXT_OPTIONS)[number] | null {
  if (!value) {
    return null;
  }

  return INTENT_CONTEXT_OPTIONS.includes(value as (typeof INTENT_CONTEXT_OPTIONS)[number])
    ? (value as (typeof INTENT_CONTEXT_OPTIONS)[number])
    : null;
}

function toIntentModeFromQuery(
  value: string | null,
): (typeof INTENT_MODE_OPTIONS)[number] | null {
  if (!value) {
    return null;
  }

  return INTENT_MODE_OPTIONS.includes(value as (typeof INTENT_MODE_OPTIONS)[number])
    ? (value as (typeof INTENT_MODE_OPTIONS)[number])
    : null;
}

function toIntentTimeFromQuery(
  value: string | null,
): (typeof INTENT_TIME_OPTIONS)[number] | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return INTENT_TIME_OPTIONS.includes(parsed as (typeof INTENT_TIME_OPTIONS)[number])
    ? (parsed as (typeof INTENT_TIME_OPTIONS)[number])
    : null;
}

export function PickTaskPanel({ initialIntent }: PickTaskPanelProps) {
  const searchParams = useSearchParams();
  const queryContext = toIntentContextFromQuery(searchParams.get("context"));
  const queryMode = toIntentModeFromQuery(searchParams.get("mode"));
  const queryTime = toIntentTimeFromQuery(searchParams.get("time"));

  const [contextChoice, setContextChoice] = useState<(typeof INTENT_CONTEXT_OPTIONS)[number]>(
    queryContext ?? initialIntent?.contextChoice ?? INTENT_CONTEXT_OPTIONS[0],
  );
  const [modeChoice, setModeChoice] = useState<(typeof INTENT_MODE_OPTIONS)[number]>(
    queryMode ?? initialIntent?.modeChoice ?? INTENT_MODE_OPTIONS[1],
  );
  const [timeChoice, setTimeChoice] = useState<(typeof INTENT_TIME_OPTIONS)[number]>(
    queryTime ?? initialIntent?.timeChoice ?? INTENT_TIME_OPTIONS[1],
  );
  const [skippedReason, setSkippedReason] = useState<SkippedReasonValue>(
    SKIPPED_REASON_OPTIONS[0],
  );
  const [notes, setNotes] = useState("");
  const [pickResult, setPickResult] = useState<PickResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isRecordingAction, setIsRecordingAction] = useState(false);

  async function handlePickTask() {
    setIsPicking(true);
    setError(null);
    setFeedback(null);

    const response = await fetch("/api/intents/pick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contextChoice,
        modeChoice,
        timeAvailableMinutes: timeChoice,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as PickResponse & {
      error?: string;
    };

    if (!response.ok) {
      setError(data.error ?? "Could not pick a task.");
      setIsPicking(false);
      return;
    }

    setPickResult(data);
    setIsPicking(false);
  }

  async function recordAction(action: PickActionValue) {
    if (!pickResult?.task || !pickResult.intentId) {
      return;
    }

    setIsRecordingAction(true);
    setError(null);
    setFeedback(null);

    const response = await fetch("/api/pick-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: pickResult.task.id,
        intentId: pickResult.intentId,
        action,
        skippedReason: action === "SKIPPED" ? skippedReason : undefined,
        notes: notes.trim().length > 0 ? notes.trim() : undefined,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as ActionResponse & {
      error?: string;
    };

    if (!response.ok) {
      setError(data.error ?? "Could not save task action.");
      setIsRecordingAction(false);
      return;
    }

    setFeedback(`Saved action: ${action}.`);
    setIsRecordingAction(false);
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2" fontWeight={700}>
            Feeling today
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="picker-context-label">Context</InputLabel>
              <Select
                labelId="picker-context-label"
                label="Context"
                value={contextChoice}
                onChange={(event) =>
                  setContextChoice(
                    event.target.value as (typeof INTENT_CONTEXT_OPTIONS)[number],
                  )
                }
              >
                {INTENT_CONTEXT_OPTIONS.map((context) => (
                  <MenuItem key={context} value={context}>
                    {TASK_CONTEXT_LABELS[context]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="picker-mode-label">Mode</InputLabel>
              <Select
                labelId="picker-mode-label"
                label="Mode"
                value={modeChoice}
                onChange={(event) =>
                  setModeChoice(
                    event.target.value as (typeof INTENT_MODE_OPTIONS)[number],
                  )
                }
              >
                {INTENT_MODE_OPTIONS.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {INTENT_MODE_LABELS[mode]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="picker-time-label">Time available</InputLabel>
              <Select
                labelId="picker-time-label"
                label="Time available"
                value={String(timeChoice)}
                onChange={(event) =>
                  setTimeChoice(Number(event.target.value) as 10 | 30 | 60)
                }
              >
                {INTENT_TIME_OPTIONS.map((minutes) => (
                  <MenuItem key={minutes} value={String(minutes)}>
                    {INTENT_TIME_LABELS[minutes]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="contained"
            onClick={handlePickTask}
            disabled={isPicking || isRecordingAction}
            sx={{ alignSelf: "flex-start" }}
          >
            {isPicking ? "Picking..." : "Pick my task"}
          </Button>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {feedback ? <Alert severity="success">{feedback}</Alert> : null}

      {isPicking ? (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Computing your weighted pick...</Typography>
          </Stack>
        </Paper>
      ) : null}

      {pickResult?.status === "no_match" ?
        <Alert severity="info">{pickResult.reason}</Alert>
      : null}

      {pickResult?.status === "picked" && pickResult.task ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" component="h2" fontWeight={700}>
              {pickResult.task.title}
            </Typography>

            {pickResult.task.description ? (
              <Typography color="text.secondary">
                {pickResult.task.description}
              </Typography>
            ) : null}

            <Alert severity="success">
              Why this was picked: {pickResult.why}
            </Alert>

            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                2-minute starter step
              </Typography>
              <Typography>{pickResult.task.starterStep}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                AI todo steps
              </Typography>
              {pickResult.task.aiGeneratedSteps.length === 0 ? (
                <Typography color="text.secondary">
                  No AI-generated steps for this task.
                </Typography>
              ) : (
                <Stack component="ul" sx={{ pl: 3, m: 0 }}>
                  {pickResult.task.aiGeneratedSteps.map((step) => (
                    <Typography key={step} component="li">
                      {step}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Checklist
              </Typography>
              {pickResult.task.checklistItems.length === 0 ? (
                <Typography color="text.secondary">No checklist items.</Typography>
              ) : (
                <Stack component="ul" sx={{ pl: 3, m: 0 }}>
                  {pickResult.task.checklistItems.map((item) => (
                    <Typography key={item} component="li">
                      {item}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Tips
              </Typography>
              {pickResult.task.tips.length === 0 ? (
                <Typography color="text.secondary">No tips.</Typography>
              ) : (
                <Stack component="ul" sx={{ pl: 3, m: 0 }}>
                  {pickResult.task.tips.map((tip) => (
                    <Typography key={tip} component="li">
                      {tip}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>

            <DividerLine />

            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Mark progress
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => recordAction("STARTED")}
                  disabled={isRecordingAction}
                >
                  Started
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={() => recordAction("DONE")}
                  disabled={isRecordingAction}
                >
                  Done
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel id="skip-reason-label">Skipped reason</InputLabel>
                  <Select
                    labelId="skip-reason-label"
                    label="Skipped reason"
                    value={skippedReason}
                    onChange={(event) =>
                      setSkippedReason(event.target.value as SkippedReasonValue)
                    }
                  >
                    {SKIPPED_REASON_OPTIONS.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {SKIPPED_REASON_LABELS[reason]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  color="warning"
                  onClick={() => recordAction("SKIPPED")}
                  disabled={isRecordingAction}
                >
                  Skipped
                </Button>
              </Stack>

              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />

              <Button href={`/app/tasks/${pickResult.task.id}`} variant="text">
                Open task details
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}

function DividerLine() {
  return <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />;
}
