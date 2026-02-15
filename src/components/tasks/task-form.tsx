"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Alert,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import {
  TASK_CONTEXTS,
  TASK_CONTEXT_LABELS,
  TASK_ENERGIES,
  TASK_ENERGY_LABELS,
  TASK_FREQUENCIES,
  TASK_FREQUENCY_LABELS,
  TASK_TIME_OPTIONS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/config";
import type { TaskFormState, TaskFormValues } from "@/lib/tasks/types";

interface TaskFormProps {
  action: (
    previousState: TaskFormState,
    formData: FormData,
  ) => Promise<TaskFormState>;
  initialValues: TaskFormValues;
  submitLabel: string;
}

const INITIAL_STATE: TaskFormState = { status: "idle" };

export function TaskForm({ action, initialValues, submitLabel }: TaskFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction}>
      <Stack spacing={2.5}>
        {state.status === "error" ? (
          <Alert severity="error">{state.message}</Alert>
        ) : null}

        {state.status === "success" ? (
          <Alert severity="success">{state.message}</Alert>
        ) : null}

        <TextField
          name="title"
          label="Title"
          required
          defaultValue={initialValues.title}
        />

        <TextField
          name="description"
          label="Description"
          multiline
          minRows={3}
          defaultValue={initialValues.description}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="frequency-label">Frequency</InputLabel>
            <Select
              name="frequency"
              labelId="frequency-label"
              label="Frequency"
              defaultValue={initialValues.frequency}
            >
              {TASK_FREQUENCIES.map((frequency) => (
                <MenuItem key={frequency} value={frequency}>
                  {TASK_FREQUENCY_LABELS[frequency]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="context-label">Context</InputLabel>
            <Select
              name="context"
              labelId="context-label"
              label="Context"
              defaultValue={initialValues.context}
            >
              {TASK_CONTEXTS.map((context) => (
                <MenuItem key={context} value={context}>
                  {TASK_CONTEXT_LABELS[context]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="energy-label">Energy</InputLabel>
            <Select
              name="energy"
              labelId="energy-label"
              label="Energy"
              defaultValue={initialValues.energy}
            >
              {TASK_ENERGIES.map((energy) => (
                <MenuItem key={energy} value={energy}>
                  {TASK_ENERGY_LABELS[energy]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              name="type"
              labelId="type-label"
              label="Type"
              defaultValue={initialValues.type}
            >
              {TASK_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {TASK_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="time-label">Time estimate</InputLabel>
            <Select
              name="timeEstimateMinutes"
              labelId="time-label"
              label="Time estimate"
              defaultValue={String(initialValues.timeEstimateMinutes)}
            >
              {TASK_TIME_OPTIONS.map((minutes) => (
                <MenuItem key={minutes} value={String(minutes)}>
                  {minutes} min
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <TextField
          name="starterStep"
          label="2-minute starter step"
          required
          defaultValue={initialValues.starterStep}
          helperText="Required. This is the tiny first move that gets you started."
        />

        <TextField
          name="checklistItems"
          label="Checklist items"
          multiline
          minRows={3}
          defaultValue={initialValues.checklistItems.join("\n")}
          helperText="Optional. One item per line."
        />

        <TextField
          name="tips"
          label="Tips"
          multiline
          minRows={3}
          defaultValue={initialValues.tips.join("\n")}
          helperText="Optional. One tip per line."
        />

        <FormControlLabel
          control={
            <Checkbox name="avoiding" defaultChecked={initialValues.avoiding} />
          }
          label="I am currently avoiding this task"
        />

        <SubmitButton label={submitLabel} />
      </Stack>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="contained" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}
