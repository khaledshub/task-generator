"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  DEFAULT_TASK_TIPS,
  LOCAL_AI_MODELS,
  LOCAL_AI_MODEL_LABELS,
  TASK_CONTEXTS,
  TASK_AI_PROVIDERS,
  TASK_AI_PROVIDER_LABELS,
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
  onStateChange?: (state: TaskFormState) => void;
  mode?: "create" | "edit";
}

const INITIAL_STATE: TaskFormState = { statusState: "idle" };

export function TaskForm({
  action,
  initialValues,
  submitLabel,
  onStateChange,
  mode = "edit",
}: TaskFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const [localAiStatus, setLocalAiStatus] = useState<TaskFormState["aiStatus"]>();
  const [localAiMessage, setLocalAiMessage] = useState<string>();
  const [lastAiTaskId, setLastAiTaskId] = useState<string>();
  const aiRequestKeyRef = useRef<string | null>(null);
  const [isGenerateStepsEnabled, setIsGenerateStepsEnabled] = useState(
    initialValues.generateAiStepsEnabled,
  );
  const [aiProvider, setAiProvider] = useState(initialValues.aiProvider);
  const [localModel, setLocalModel] = useState<(typeof LOCAL_AI_MODELS)[number]>(
    LOCAL_AI_MODELS[0],
  );
  const [tipsValue, setTipsValue] = useState(() =>
    toInitialTipsValue(initialValues.tips, initialValues.generateAiStepsEnabled),
  );
  const defaultTipsText = initialValues.tips.join("\n");
  const nonDefaultTipsText = removeDefaultTips(initialValues.tips).join("\n");
  const isCreateMode = mode === "create";

  useEffect(() => {
    const request = state.aiGenerationRequest;
    if (!request || state.statusState !== "success") {
      return;
    }

    const requestKey = `${request.taskId}:${request.aiProvider}`;
    if (aiRequestKeyRef.current === requestKey) {
      return;
    }
    aiRequestKeyRef.current = requestKey;

    void (async () => {
      setLocalAiStatus("info");
      const sourceLabel =
        request.aiProvider === "LOCAL" && request.localModel
          ? `${TASK_AI_PROVIDER_LABELS[request.aiProvider]} (${request.localModel})`
          : TASK_AI_PROVIDER_LABELS[request.aiProvider];
      setLocalAiMessage(`Generating AI tips with ${sourceLabel}...`);
      setLastAiTaskId(request.taskId);

      try {
        const response = await fetch("/api/ai/starter-step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          tips?: string[];
        };

        if (!response.ok) {
          setLocalAiStatus("error");
          setLocalAiMessage(
            data.error ??
              `AI generation failed after task save (${TASK_AI_PROVIDER_LABELS[request.aiProvider]}).`,
          );
          return;
        }

        if (Array.isArray(data.tips) && data.tips.length > 0) {
          setTipsValue(data.tips.join("\n"));
        }

        setLocalAiStatus("success");
        const successSourceLabel =
          request.aiProvider === "LOCAL" && request.localModel
            ? `${TASK_AI_PROVIDER_LABELS[request.aiProvider]} (${request.localModel})`
            : TASK_AI_PROVIDER_LABELS[request.aiProvider];
        setLocalAiMessage(
          `AI response ready. Tips were generated with ${successSourceLabel} and applied.`,
        );
      } catch (error) {
        setLocalAiStatus("error");
        setLocalAiMessage(
          error instanceof Error
            ? error.message
            : `AI generation failed after task save (${TASK_AI_PROVIDER_LABELS[request.aiProvider]}).`,
        );
      }
    })();
  }, [state.aiGenerationRequest, state.statusState]);

  useEffect(() => {
    const effectiveState: TaskFormState = {
      ...state,
      aiStatus: localAiStatus ?? state.aiStatus,
      aiMessage: localAiMessage ?? state.aiMessage,
    };

    onStateChange?.(effectiveState);
  }, [localAiMessage, localAiStatus, onStateChange, state]);

  const aiTipsStatus = localAiStatus ?? state.aiStatus;
  const aiTipsMessage = localAiMessage ?? state.aiMessage;

  return (
    <form action={formAction}>
      <Stack spacing={2.5}>
        {state.statusState === "error" ? (
          <Alert severity="error">{state.message}</Alert>
        ) : null}

        {state.statusState === "success" ? (
          <Alert severity="success">{state.message}</Alert>
        ) : null}

        {aiTipsStatus === "success" && aiTipsMessage ? (
          <Alert
            severity="success"
            action={
              lastAiTaskId ? (
                <Button
                  color="inherit"
                  size="small"
                  href={`/app/tasks/${lastAiTaskId}`}
                  sx={{ fontWeight: 700 }}
                >
                  Jump to task details
                </Button>
              ) : undefined
            }
          >
            {aiTipsMessage}
          </Alert>
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

        <Stack spacing={1}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Generate todo steps
              </Typography>
              <Switch
                name="generateAiStepsEnabled"
                checked={isGenerateStepsEnabled}
                onChange={(event) => {
                  const nextChecked = event.target.checked;
                  setIsGenerateStepsEnabled(nextChecked);
                  setTipsValue((current) => {
                    if (nextChecked && current.trim() === defaultTipsText.trim()) {
                      return nonDefaultTipsText;
                    }

                    if (!nextChecked && current.trim().length === 0) {
                      return defaultTipsText;
                    }

                    return current;
                  });
                }}
                inputProps={{ "aria-label": "Generate todo steps" }}
              />
            </Stack>
            <FormControl sx={{ minWidth: 180 }} size="small" disabled={!isGenerateStepsEnabled}>
              <InputLabel id="ai-provider-label">AI source</InputLabel>
              <Select
                name="aiProvider"
                labelId="ai-provider-label"
                label="AI source"
                value={aiProvider}
                onChange={(event) => {
                  setAiProvider(event.target.value as typeof TASK_AI_PROVIDERS[number]);
                }}
              >
                {TASK_AI_PROVIDERS.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {TASK_AI_PROVIDER_LABELS[provider]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {isGenerateStepsEnabled && aiProvider === "LOCAL" ? (
              <FormControl sx={{ minWidth: 190 }} size="small">
                <InputLabel id="local-model-label">Local model</InputLabel>
                <Select
                  name="localModel"
                  labelId="local-model-label"
                  label="Local model"
                  value={localModel}
                  onChange={(event) => {
                    setLocalModel(event.target.value as (typeof LOCAL_AI_MODELS)[number]);
                  }}
                >
                  {LOCAL_AI_MODELS.map((model) => (
                    <MenuItem key={model} value={model}>
                      {LOCAL_AI_MODEL_LABELS[model]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
          </Stack>

          {!isCreateMode ? (
            <TextField
              name="starterStep"
              label="2-minute starter step"
              defaultValue={initialValues.starterStep}
              helperText={
                isGenerateStepsEnabled
                  ? "This text is used as a prompt hint. AI generates todo steps after task save."
                  : "This is the tiny first move that gets you started."
              }
            />
          ) : null}
        </Stack>

        {!(isCreateMode && isGenerateStepsEnabled) ? (
          <TextField
            name="tips"
            label="Get started"
            multiline
            minRows={3}
            value={tipsValue}
            onChange={(event) => setTipsValue(event.target.value)}
            helperText={
              isGenerateStepsEnabled
                ? "Generated by AI. You can edit after generation."
                : "Optional. One suggestion per line."
            }
          />
        ) : null}
        {isGenerateStepsEnabled && aiTipsStatus !== "success" ? (
          <Alert severity={aiTipsStatus ?? "info"}>
            {aiTipsMessage ??
              `Tips will be generated with ${TASK_AI_PROVIDER_LABELS[aiProvider]} after you save.`}
          </Alert>
        ) : null}

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

function toInitialTipsValue(initialTips: string[], isGenerateStepsEnabled: boolean): string {
  if (!isGenerateStepsEnabled) {
    return initialTips.join("\n");
  }

  return removeDefaultTips(initialTips).join("\n");
}

function removeDefaultTips(tips: string[]): string[] {
  const defaultTipSet = new Set(DEFAULT_TASK_TIPS.map((tip) => tip.trim().toLowerCase()));
  return tips.filter((tip) => !defaultTipSet.has(tip.trim().toLowerCase()));
}
