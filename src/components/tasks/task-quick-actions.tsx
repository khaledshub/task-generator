"use client";

import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  SKIPPED_REASON_LABELS,
  SKIPPED_REASON_OPTIONS,
  type PickActionValue,
  type SkippedReasonValue,
} from "@/lib/picker/config";

interface TaskQuickActionsProps {
  taskId: string;
  intentId?: string;
}

export function TaskQuickActions({ taskId, intentId }: TaskQuickActionsProps) {
  const [skippedReason, setSkippedReason] = useState<SkippedReasonValue>(
    SKIPPED_REASON_OPTIONS[0],
  );
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onRecordAction(action: PickActionValue) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/pick-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        intentId,
        action,
        skippedReason: action === "SKIPPED" ? skippedReason : undefined,
        notes: notes.trim().length > 0 ? notes.trim() : undefined,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Failed to save task action.");
      setPending(false);
      return;
    }

    setSuccess(`Saved action: ${action}.`);
    setPending(false);
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" fontWeight={600}>
        Quick actions
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="outlined"
          onClick={() => onRecordAction("STARTED")}
          disabled={pending}
        >
          Started
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => onRecordAction("DONE")}
          disabled={pending}
        >
          Done
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="task-skip-reason-label">Skipped reason</InputLabel>
          <Select
            labelId="task-skip-reason-label"
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
          onClick={() => onRecordAction("SKIPPED")}
          disabled={pending}
        >
          Skipped
        </Button>
      </Stack>

      <TextField
        label="Notes (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
    </Stack>
  );
}
